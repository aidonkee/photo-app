import { PrismaClient } from "@prisma/client";
import { pgmq } from "prisma-pgmq";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import pLimit from "p-limit";
import { addWatermark } from "./watermark";

export class ServerlessWorker {
  private prisma: PrismaClient;
  private queueName: string;
  private batchSize: number;
  private visibilityWindow: number;

  constructor(prisma: PrismaClient, queueName: string, batchSize = 10) {
    this.prisma = prisma;
    this.queueName = queueName;
    this.batchSize = batchSize;
    this.visibilityWindow = 180;
  }

  async performTask(msg: any) {
    console.log(`[Job ${msg.msg_id}] Processing:`); //, payload);

    await processMsg(msg.message.data, this.prisma);

    return true;
  }

  async runBatch() {
    // await pgmq.createQueue(this.prisma, this.queueName).catch(() => {});
    const messages = await pgmq.read(
      this.prisma,
      this.queueName,
      this.visibilityWindow,
      this.batchSize,
    );

    if (messages.length === 0) return { count: 0, status: "empty" };

    console.log(`🔥 Processing batch of ${messages.length} jobs...`);

    const limit = pLimit(50);
    const results = await Promise.allSettled(
      messages.map(async (msg) => {
        return limit(async () => {
          try {
            await this.performTask(msg);

            await pgmq.archive(this.prisma, this.queueName, msg.msg_id);

            return "success";
          } catch (err) {
            console.error(`[Job ${msg.msg_id}] Failed:`, err);
            throw err;
          }
        });
      }),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;

    return {
      count: messages.length,
      successes: successCount,
      failures: messages.length - successCount,
    };
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = "school-photos";
const WATERMARK_FILE = path.join(process.cwd(), "public", "watermark.png");

async function processMsg(
  data: {
    originalPath: string;
    width: any;
    height: any;
    classId: any;
    alt: any;
  },
  prisma: PrismaClient,
) {
  try {
    console.log("📥 Downloading original:", data.originalPath);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(data.originalPath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download original: ${downloadError?.message}`);
    }

    const originalBuffer = Buffer.from(await fileData.arrayBuffer());
    console.log("✅ Downloaded original:", originalBuffer.length, "bytes");

    const fileId =
      data.originalPath
        ?.split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") || uuidv4();

    console.log("🔧 Creating low-quality preview...");
    const meta = await sharp(originalBuffer).metadata();
    let width = meta.width || data.width;
    let height = meta.height || data.height;
    const maxWidth = 1200;

    if (width > maxWidth) {
      const ratio = height / width;
      width = maxWidth;
      height = Math.round(maxWidth * ratio);
    }

    let watermarkedBuffer: Buffer;

    const wmBuffer = fs.readFileSync(WATERMARK_FILE);
    watermarkedBuffer = (await addWatermark(wmBuffer)).buffer;
    console.log(
      "✅ Watermarked preview created:",
      watermarkedBuffer.length,
      "bytes",
    );

    // 8. Create THUMBNAIL
    console.log("🔧 Creating thumbnail...");
    const thumbnailBuffer = await sharp(watermarkedBuffer)
      .resize(300, 300, { fit: "cover", position: "center" })
      .jpeg({ quality: 70 })
      .toBuffer();
    console.log("✅ Thumbnail created:", thumbnailBuffer.length, "bytes");

    // 9. Upload watermarked + thumbnail to Supabase
    const watermarkedPath = `watermarked/${data.classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${data.classId}/${fileId}.jpg`;

    console.log("📤 Uploading watermarked:", watermarkedPath);
    const { error: wmError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(watermarkedPath, watermarkedBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (wmError)
      throw new Error(`Failed to upload watermarked: ${wmError.message}`);

    console.log("📤 Uploading thumbnail:", thumbnailPath);
    const { error: thumbError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (thumbError)
      if (thumbError.message !== "The resource already exists")
        throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);

    // 10. Get public URLs
    const { data: wmUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(watermarkedPath);
    const { data: thumbUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbnailPath);

    const watermarkedUrl = wmUrlData.publicUrl;
    const thumbnailUrl = thumbUrlData.publicUrl;
    console.log("🔗 Public URLs:", { watermarkedUrl, thumbnailUrl });

    // 11. Insert photo record into database
    const photo = await prisma.photo.create({
      data: {
        classId: data.classId,
        originalUrl: data.originalPath,
        watermarkedUrl,
        thumbnailUrl,
        width,
        height,
        fileSize: watermarkedBuffer.length,
        mimeType: "image/jpeg",
        alt: data.alt || null,
        tags: [],
      },
    });

    console.log("✅ Photo saved to DB:", photo.id);

    return {
      success: true,
      photoId: photo.id,
      watermarkedUrl,
      thumbnailUrl,
    };
  } catch (error: any) {
    console.error("Failed to process photo:", error);
    throw new Error(`Processing error: ${error.message}`);
  }
}
