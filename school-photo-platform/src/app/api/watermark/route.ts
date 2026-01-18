// src/app/api/watermark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const WATERMARK_PATH = path.join(process.cwd(), 'public', 'watermark.png');

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    // Fetch оригинал
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Применяем watermark (если есть файл)
    let resultBuffer = buffer;
    
    if (fs.existsSync(WATERMARK_PATH)) {
      resultBuffer = await sharp(buffer)
        .composite([{
          input: WATERMARK_PATH,
          tile: true,
          blend: 'over',
        }])
        .jpeg({ quality: 85 })
        .toBuffer();
    } else {
      // Если нет watermark файла, просто конвертим в JPEG
      resultBuffer = await sharp(buffer)
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    return new NextResponse(resultBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Watermark error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}