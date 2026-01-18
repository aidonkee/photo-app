import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const WATERMARK_PATH = path.join(process.cwd(), 'public', 'watermark.png');

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Создаем экземпляр sharp из оригинала
    let sharpInstance = sharp(buffer as any);
    
    // Получаем метаданные, чтобы знать размер
    const metadata = await sharpInstance.metadata();
    
    // Оптимизация: сжимаем до 1200px (родителям больше не надо для просмотра)
    // Это сильно ускорит работу и уменьшит потребление памяти
    if (metadata.width && metadata.width > 1200) {
      sharpInstance = sharpInstance.resize(1200);
    }

    let resultBuffer: Buffer;

    if (fs.existsSync(WATERMARK_PATH)) {
      resultBuffer = await sharpInstance
        .composite([{
          input: WATERMARK_PATH,
          tile: true,
          blend: 'over',
        }])
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      resultBuffer = await sharpInstance.jpeg({ quality: 80 }).toBuffer();
    }

    return new NextResponse(new Uint8Array(resultBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('🔥 Watermark error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}