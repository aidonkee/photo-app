import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { uploadFile, getPublicUrl } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const classId = formData.get('classId') as string | null;

    if (!file || !classId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // 1. ПОЛУЧАЕМ ИСХОДНЫЙ БУФЕР
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer); // Это наш святой грааль, его не трогаем
    
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const WATERMARK_PATH = path.join(process.cwd(), 'public', 'watermark.png');

    // --- ШАГ 1: ЗАГРУЗКА ОРИГИНАЛА (СРАЗУ) ---
    // Мы загружаем originalBuffer ПЕРВЫМ, пока с ним ничего не случилось
    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    console.log('Uploading original to:', originalPath);
    await uploadFile(originalBuffer, originalPath, file.type);

    // --- ШАГ 2: СОЗДАНИЕ ВЕРСИИ С ВОТЕРМАРКОЙ ---
    let watermarkedBuffer: Buffer;

    if (fs.existsSync(WATERMARK_PATH)) {
      // Подготавливаем вотермарку заранее
      const wmOverlay = await sharp(WATERMARK_PATH)
        .resize(500, 500, { fit: 'inside' })
        .toBuffer();

      // Накладываем на оригинал
      watermarkedBuffer = await sharp(originalBuffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .composite([
          { 
            input: wmOverlay, 
            tile: true,        // Заполнит всё изображение вотермаркой
            blend: 'over'      // Убедитесь, что режим наложения правильный
          }
        ])
        .jpeg({ quality: 75 })
        .toBuffer();
    } else {
      // Если вотермарки нет, просто ресайзим
      watermarkedBuffer = await sharp(originalBuffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
    }

    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    await uploadFile(watermarkedBuffer, watermarkedPath, 'image/jpeg');
    // --- ШАГ 3: СОЗДАНИЕ МИНИАТЮРЫ ---
    // Тоже из чистого буфера (или из вотермарки, если хочешь защиту в превью)
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 60 })
      .toBuffer();

    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;
    await uploadFile(thumbnailBuffer, thumbnailPath, 'image/jpeg');

    // 4. МЕТАДАННЫЕ
    const meta = await sharp(originalBuffer).metadata();

    // 5. ЗАПИСЬ В БД
    // Проверь, чтобы названия полей в prisma.photo.create СОВПАДАЛИ с твоей схемой
    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl: originalPath,           // Путь к чистой картинке
        watermarkedUrl: getPublicUrl(watermarkedPath), // URL к вотермарке
        thumbnailUrl: getPublicUrl(thumbnailPath),     // URL к превью
        width: meta.width || 0,
        height: meta.height || 0,
        fileSize: originalBuffer.length,
        mimeType: file.type,
        alt: file.name,
      },
    });

    return NextResponse.json({ success: true, id: photo.id });

  } catch (error: any) {
    console.error('CRITICAL UPLOAD ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}