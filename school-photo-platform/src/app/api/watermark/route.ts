import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const WATERMARK_PATH = path.join(process.cwd(), 'public', 'watermark.png');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL! ;
const BUCKET_NAME = 'school-photos'; // Или как у тебя называется бакет

export async function GET(request: NextRequest) {
  try {
    const urlParam = request.nextUrl.searchParams.get('url');
    if (!urlParam) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

    // ✅ Если это путь в бакете — собираем полный URL
    let imageUrl = urlParam;
    if (! urlParam.startsWith('http')) {
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${urlParam}`;
    }

    console.log('📸 Fetching image from:', imageUrl);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, imageUrl);
      return NextResponse. json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (! metadata.width || !metadata.height) {
      throw new Error('Could not read image metadata');
    }

    let resultBuffer:  Buffer;

    if (fs.existsSync(WATERMARK_PATH)) {
      resultBuffer = await image
        .composite([{
          input:  WATERMARK_PATH,
          tile: true,
          blend: 'over',
        }])
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      console.warn('⚠️ Watermark file not found at:', WATERMARK_PATH);
      resultBuffer = await image. jpeg({ quality: 80 }).toBuffer();
    }

    return new NextResponse(new Uint8Array(resultBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error:  any) {
    console.error('🔥 Watermark error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
