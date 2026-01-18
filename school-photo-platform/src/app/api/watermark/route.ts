import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Путь к вотермарке в папке public
const WATERMARK_PATH = path.join(process.cwd(), 'public', 'watermark.png');

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    // 1. Fetch оригинала
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    // 2. РАБОТА С ТИПАМИ (Фикс для билда Vercel)
    const arrayBuffer = await response.arrayBuffer();
    // Явно приводим к Buffer, чтобы избежать конфликта ArrayBufferLike
    const buffer = Buffer.from(arrayBuffer) as Buffer; 

    let resultBuffer: Buffer;

    // 3. ОБРАБОТКА ЧЕРЕЗ SHARP
    if (fs.existsSync(WATERMARK_PATH)) {
      // Используем (buffer as any), чтобы TypeScript проигнорировал несовпадение типов Buffer
      resultBuffer = await sharp(buffer as any)
        .composite([{
          input: WATERMARK_PATH,
          tile: true,      // Размножаем вотермарку сеткой
          blend: 'over',
        }])
        .jpeg({ quality: 85 })
        .toBuffer();
    } else {
      console.warn('⚠️ Watermark file not found at:', WATERMARK_PATH);
      // Если файла вотермарки нет, просто возвращаем оптимизированный JPEG
      resultBuffer = await sharp(buffer as any)
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // 4. ОТВЕТ
    // Используем Uint8Array для максимальной совместимости в Edge-функциях
    return new NextResponse(new Uint8Array(resultBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        // Кэшируем на год, так как оригиналы не меняются
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('🔥 Watermark error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}