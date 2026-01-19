import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { uploadFile, getPublicUrl } from '@/lib/storage';
import { addWatermark, createThumbnail } from '@/lib/watermark';

function extFromMime(mime: string | undefined): 'jpg' | 'png' | 'webp' {
  if (!mime) return 'jpg';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const classId = formData.get('classId') as string | null;

    if (!file || !classId) {
      return NextResponse.json({ error: 'File and classId are required' }, { status: 400 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    if (!classroom || (session.role === 'ADMIN' && classroom.school.adminId !== session.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Валидация
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Метаданные
    const meta = await sharp(buffer).metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    const fileId = uuidv4();
    const ext = extFromMime(file.type);
    const originalPath = `originals/${classId}/${fileId}.${ext}`;

    // 1) Загружаем ОРИГИНАЛ как ПУТЬ (без публичного URL)
    await uploadFile(buffer, originalPath, file.type || 'image/jpeg');

    // 2) Генерируем WATERMARKED (JPEG)
    let watermarkedBuffer: Buffer;
    let watermarkedSize = 0;
    try {
      const result = await addWatermark(buffer);
      watermarkedBuffer = result.buffer;
      watermarkedSize = result.size;
    } catch (e: any) {
      // Фоллбэк: просто конвертируем в JPEG, чтобы watermarked не был пуст
      console.error('addWatermark failed, fallback JPEG:', e?.message || e);
      watermarkedBuffer = await sharp(buffer).jpeg({ quality: 85, progressive: true }).toBuffer();
      watermarkedSize = watermarkedBuffer.length;
    }
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    await uploadFile(watermarkedBuffer, watermarkedPath, 'image/jpeg');

    // 3) Генерируем THUMBNAIL
    let thumbnailBuffer: Buffer;
    try {
      thumbnailBuffer = await createThumbnail(watermarkedBuffer);
    } catch (e: any) {
      console.error('createThumbnail failed, fallback resize:', e?.message || e);
      thumbnailBuffer = await sharp(watermarkedBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
    }
    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;
    await uploadFile(thumbnailBuffer, thumbnailPath, 'image/jpeg');

    // 4) Публичные URL ТОЛЬКО для watermarked + thumbnail
    const watermarkedUrl = getPublicUrl(watermarkedPath);
    const thumbnailUrl = getPublicUrl(thumbnailPath);

    // 5) Сохраняем запись: originalUrl — ПУТЬ (без публичного URL!)
    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl: originalPath,          // путь; держим приватным по RLS
        watermarkedUrl,                     // публичный URL
        thumbnailUrl,                       // публичный URL
        width,
        height,
        fileSize: watermarkedSize,          // физ. размер watermarked
        mimeType: 'image/jpeg',             // формат watermarked/thumbnail
        alt: file.name.replace(/\.[^/.]+$/, ''),
        tags: [],
      },
    });

    console.log('✅ Photo uploaded:', photo.id);

    return NextResponse.json({
      success: true,
      data: {
        id: photo.id,
        watermarkedUrl,
        thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}