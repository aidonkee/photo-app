'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const supabaseUrl = process.env. NEXT_PUBLIC_SUPABASE_URL! ;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'school-photos';
const WATERMARK_FILE = path.join(process.cwd(), 'public', 'watermark.png');

// SVG фоллбэк для watermark
const svgOverlay = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <pattern id="wm" patternUnits="userSpaceOnUse" width="400" height="400" patternTransform="rotate(-30)">
        <text x="20" y="200" font-size="48" font-family="Arial, sans-serif" fill="rgba(255,0,0,0.35)">
          sample
        </text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
  </svg>
`);

/**
 * Photo record data from client upload
 */
type PhotoRecordInput = {
  classId: string;
  originalUrl: string;
  originalPath: string; // путь в storage (originals/classId/filename. jpg)
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  alt?:  string | null;
};

/**
 * Process uploaded photo:  create watermark + thumbnail, save to DB
 * Called AFTER client uploads original to Supabase
 */
export async function processAndSavePhoto(data: PhotoRecordInput) {
  // 1. Authentication check
  const session = await getSession();
  
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized:  Admin access required');
  }

  // 2. Validate classroom exists and belongs to this admin
  const classroom = await prisma.classroom.findUnique({
    where: { id: data. classId },
    include: {
      school: {
        select: {
          id: true,
          adminId: true,
        },
      },
    },
  });

  if (!classroom) {
    throw new Error(`Classroom not found: ${data. classId}`);
  }

  // 3. Authorization:  Check if this admin owns the school
  if (session.role === 'ADMIN' && classroom.school.adminId !== session. userId) {
    throw new Error('Forbidden: You do not have access to this classroom');
  }

  // 4. Validate input data
  if (!data.originalUrl || !data.originalPath || !data.width || !data.height || !data.fileSize) {
    throw new Error('Invalid photo data:  missing required fields');
  }

  try {
    // 5. Download original from Supabase
    console.log('📥 Downloading original:', data.originalPath);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(data.originalPath);
    
    if (downloadError || !fileData) {
      throw new Error(`Failed to download original: ${downloadError?.message}`);
    }

    const originalBuffer = Buffer.from(await fileData.arrayBuffer());
    console.log('✅ Downloaded original:', originalBuffer.length, 'bytes');

    // 6. Generate unique ID for watermarked/thumbnail
    const fileId = data.originalPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || uuidv4();

    // 7. Create LOW QUALITY PREVIEW (watermarked)
    console.log('🔧 Creating low-quality preview...');
    const meta = await sharp(originalBuffer).metadata();
    let width = meta.width || data.width;
    let height = meta.height || data.height;
    const maxWidth = 1200;

    if (width > maxWidth) {
      const ratio = height / width;
      width = maxWidth;
      height = Math.round(maxWidth * ratio);
    }

    let watermarkedBuffer:  Buffer;
    
    // Наложение watermark
    if (fs.existsSync(WATERMARK_FILE)) {
      const wmBuffer = fs.readFileSync(WATERMARK_FILE);
      // Ресайзим watermark под размер изображения
      const resizedWatermark = await sharp(wmBuffer)
        .resize(Math.min(500, Math.floor(width / 3)), null, { fit: 'inside' })
        .toBuffer();
      
      watermarkedBuffer = await sharp(originalBuffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .composite([{ input: resizedWatermark, tile: true, blend: 'over' }])
        .jpeg({ quality: 60, progressive: true })
        .toBuffer();
    } else {
      // Фоллбэк:  SVG плитка
      watermarkedBuffer = await sharp(originalBuffer)
        .resize(width, height, { fit:  'inside', withoutEnlargement: true })
        .composite([{ input: svgOverlay, tile: true, blend:  'over' }])
        .jpeg({ quality: 60, progressive:  true })
        .toBuffer();
    }
    console.log('✅ Watermarked preview created:', watermarkedBuffer.length, 'bytes');

    // 8. Create THUMBNAIL
    console.log('🔧 Creating thumbnail...');
    const thumbnailBuffer = await sharp(watermarkedBuffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 70 })
      .toBuffer();
    console.log('✅ Thumbnail created:', thumbnailBuffer.length, 'bytes');

    // 9. Upload watermarked + thumbnail to Supabase
    const watermarkedPath = `watermarked/${data.classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${data.classId}/${fileId}.jpg`;

    console.log('📤 Uploading watermarked:', watermarkedPath);
    const { error: wmError } = await supabase. storage
      .from(BUCKET_NAME)
      .upload(watermarkedPath, watermarkedBuffer, {
        contentType:  'image/jpeg',
        upsert: false,
      });
    if (wmError) throw new Error(`Failed to upload watermarked: ${wmError.message}`);

    console.log('📤 Uploading thumbnail:', thumbnailPath);
    const { error: thumbError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType:  'image/jpeg',
        upsert: false,
      });
    if (thumbError) throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);

    // 10. Get public URLs
    const { data: wmUrlData } = supabase.storage. from(BUCKET_NAME).getPublicUrl(watermarkedPath);
    const { data: thumbUrlData } = supabase. storage.from(BUCKET_NAME).getPublicUrl(thumbnailPath);

    const watermarkedUrl = wmUrlData. publicUrl;
    const thumbnailUrl = thumbUrlData.publicUrl;
    console.log('🔗 Public URLs:', { watermarkedUrl, thumbnailUrl });

    // 11. Insert photo record into database
    const photo = await prisma.photo.create({
      data: {
        classId: data.classId,
        originalUrl: data.originalPath, // Путь к оригиналу (приватный)
        watermarkedUrl,                  // Публичный URL (с watermark)
        thumbnailUrl,                    // Публичный URL (миниатюра)
        width,
        height,
        fileSize: watermarkedBuffer.length,
        mimeType: 'image/jpeg',
        alt: data.alt || null,
        tags: [],
      },
    });

    console.log('✅ Photo saved to DB:', photo.id);

    return {
      success: true,
      photoId: photo.id,
      watermarkedUrl,
      thumbnailUrl,
    };
  } catch (error:  any) {
    console.error('Failed to process photo:', error);
    throw new Error(`Processing error: ${error.message}`);
  }
}

/**
 * Batch revalidation after all uploads complete
 * Call this ONCE at the end of upload batch
 */
export async function revalidateClassroomPhotos(classId: string, schoolId: string) {
  const session = await getSession();
  
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  try {
    // Revalidate classroom page
    revalidatePath(`/admin/schools/${schoolId}/classrooms/${classId}`);
    // Revalidate school page
    revalidatePath(`/admin/schools/${schoolId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to revalidate paths:', error);
    return { success: false };
  }
}