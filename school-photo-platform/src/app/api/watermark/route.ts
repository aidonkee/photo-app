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
    if (!response.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Инициализируем Sharp и ОБЯЗАТЕЛЬНО получаем метаданные
    // Это заставляет Sharp «прочитать» оригинал до начала композиции
    const image = sharp(buffer as any);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image metadata');
    }

    let resultBuffer: Buffer;

    // 2. Проверяем наличие файла вотермарки
    if (fs.existsSync(WATERMARK_PATH)) {
      resultBuffer = await image
        .composite([{
          input: WATERMARK_PATH,
          tile: true,      // Размножаем вотермарку
          blend: 'over',   // Накладываем ПОВЕРХ оригинала
        }])
        .jpeg({ quality: 80 }) 
        .toBuffer();
    } else {
      // Если вотермарки нет, отдаем просто пожатый оригинал
      resultBuffer = await image.jpeg({ quality: 80 }).toBuffer();
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