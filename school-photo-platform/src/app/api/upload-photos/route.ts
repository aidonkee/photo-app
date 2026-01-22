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
    // (Проверка прав доступа остается прежней...)
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const classId = formData.get('classId') as string | null;

    if (!file || !classId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    // Пути
    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;

    // 1. ЗАПУСКАЕМ ЗАГРУЗКУ ОРИГИНАЛА (Асинхронно, не ждем пока завершится)
    const uploadOriginalPromise = uploadFile(originalBuffer, originalPath, file.type);

    // 2. ПАРАЛЛЕЛЬНО ГОТОВИМ БУФЕРЫ (Sharp)
    // Используем .clone(), чтобы потоки sharp не конфликтовали
    const sharpStream = sharp(originalBuffer);
    
    // Подготовка вотермарки
    const watermarkTask = (async () => {
        const WATERMARK_PATH = path.join(process.cwd(), 'public', 'watermark.png');
        let buffer;
        
        if (fs.existsSync(WATERMARK_PATH)) {
            const wmOverlay = await sharp(WATERMARK_PATH).resize(500, 500, { fit: 'inside' }).toBuffer();
            buffer = await sharpStream.clone() // Важно: clone()
                .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
                .composite([{ input: wmOverlay, tile: true, blend: 'over' }])
                .jpeg({ quality: 75 })
                .toBuffer();
        } else {
            buffer = await sharpStream.clone()
                .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 75 })
                .toBuffer();
        }
        return uploadFile(buffer, watermarkedPath, 'image/jpeg');
    })();

    // Подготовка миниатюры
    const thumbnailTask = (async () => {
        const buffer = await sharpStream.clone() // Важно: clone()
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 60 })
            .toBuffer();
        return uploadFile(buffer, thumbnailPath, 'image/jpeg');
    })();

    // Получение метаданных (быстро)
    const metadataPromise = sharpStream.metadata();

    // 3. ЖДЕМ ЗАВЕРШЕНИЯ ВСЕХ ОПЕРАЦИЙ РАЗОМ
    // Это ключевой момент ускорения: мы ждем самую длинную операцию, а не сумму всех
    const [_, __, ___, meta] = await Promise.all([
        uploadOriginalPromise,
        watermarkTask,
        thumbnailTask,
        metadataPromise
    ]);

    // 4. ЗАПИСЬ В БД
    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl: originalPath, // Если S3 возвращает полный URL, поправьте тут
        watermarkedUrl: getPublicUrl(watermarkedPath),
        thumbnailUrl: getPublicUrl(thumbnailPath),
        width: meta.width || 0,
        height: meta.height || 0,
        fileSize: originalBuffer.length,
        mimeType: file.type,
        alt: file.name,
      },
    });

    return NextResponse.json({ success: true, id: photo.id });

  } catch (error: any) {
    console.error('UPLOAD ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}