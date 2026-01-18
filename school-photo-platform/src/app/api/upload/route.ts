import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { addWatermark, createThumbnail } from '@/lib/watermark';
import { uploadFileDirect, getPublicUrl } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
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

    // 2. Проверка класса
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    if (!classroom || classroom.school.adminId !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. Подготовка буфера
    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    console.log(`📸 Начинаем обработку файла: ${file.name}, размер: ${originalBuffer.length} байт`);

    const fileId = uuidv4();
    const fileExtension = getFileExtension(file.name, file.type);

    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;

    // --- ЭТАП 1: Загрузка оригинала ---
    try {
      await uploadFileDirect(originalPath, originalBuffer, file.type || 'image/jpeg');
      console.log("✅ Оригинал загружен:", originalPath);
    } catch (err) {
      console.error("❌ Ошибка при загрузке ОРИГИНАЛА:", err);
      throw err;
    }

    // --- ЭТАП 2: Вотермарка ---
    let wmBuffer: Buffer;
    let width: number, height: number, size: number;
    
    try {
      const wmResult = await addWatermark(originalBuffer);
      wmBuffer = wmResult.buffer;
      width = wmResult.width;
      height = wmResult.height;
      size = wmResult.size;
      console.log(`✅ Вотермарка создана (Sharp). Размер: ${wmBuffer.length} байт`);
      
      const uploadRes = await uploadFileDirect(watermarkedPath, wmBuffer, 'image/jpeg');
      console.log("✅ Вотермарка загружена в Supabase:", uploadRes);
    } catch (err) {
      console.error("❌ КРИТИЧЕСКАЯ ОШИБКА НА ЭТАПЕ ВОТЕРМАРКИ:", err);
      // Мы не прерываем весь процесс, если упала только вотермарка, 
      // но в твоем случае это важно, поэтому логируем максимально подробно
      throw err; 
    }

    // --- ЭТАП 3: Миниатюра ---
    try {
      const thumbnailBuffer = await createThumbnail(originalBuffer);
      console.log(`✅ Миниатюра создана (Sharp). Размер: ${thumbnailBuffer.length} байт`);
      
      await uploadFileDirect(thumbnailPath, thumbnailBuffer, 'image/jpeg');
      console.log("✅ Миниатюра загружена в Supabase");
    } catch (err) {
      console.error("❌ Ошибка на этапе МИНИАТЮРЫ:", err);
    }

    // 4. Генерация URL и запись в БД
    const originalUrl = getPublicUrl(originalPath);
    const watermarkedUrl = getPublicUrl(watermarkedPath);
    const thumbnailUrl = getPublicUrl(thumbnailPath);

    console.log("🔗 Ссылки подготовлены:", { watermarkedUrl, thumbnailUrl });

    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl,
        watermarkedUrl,
        thumbnailUrl,
        width,
        height,
        fileSize: size,
        mimeType: 'image/jpeg',
        alt: file.name.replace(/\.[^/.]+$/, ''),
        tags: [],
      },
    });

    console.log("💾 Запись в БД создана, ID:", photo.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: photo.id,
          url: watermarkedUrl,
          publicUrl: watermarkedUrl,
          path: watermarkedPath,
          thumbnailUrl,
          originalUrl,
          size,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('🔥 Глобальная ошибка Upload API:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}

function getFileExtension(filename: string, mime: string | undefined) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.jpeg')) return 'jpeg';
  if (lower.endsWith('.jpg')) return 'jpg';
  if (lower.endsWith('.webp')) return 'webp';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg') return 'jpg';
  return 'jpg';
}