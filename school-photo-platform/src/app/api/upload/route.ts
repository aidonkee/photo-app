import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { addWatermark, createThumbnail } from '@/lib/watermark';
import { uploadFileDirect, getPublicUrl } from '@/lib/storage';

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
    if (!classroom || classroom.school.adminId !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    const fileId = uuidv4();
    const fileExtension = getFileExtension(file.name, file.type);

    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;

    // Загружаем оригинал
    await uploadFileDirect(originalPath, originalBuffer, file.type || 'image/jpeg');

    // Готовим вотермарк (без падения всего запроса)
    let wmBuffer = originalBuffer;
    let width = 0;
    let height = 0;
    let size = originalBuffer.length;
    try {
      const wm = await addWatermark(originalBuffer);
      wmBuffer = wm.buffer;
      width = wm.width;
      height = wm.height;
      size = wm.size;
    } catch (err) {
      console.error('Watermark step failed, fallback to original for WM:', err);
    }
    await uploadFileDirect(watermarkedPath, wmBuffer, 'image/jpeg');

    // Миниатюра (если упадёт — не валим запрос)
    try {
      const thumbnailBuffer = await createThumbnail(originalBuffer);
      await uploadFileDirect(thumbnailPath, thumbnailBuffer, 'image/jpeg');
    } catch (err) {
      console.error('Thumbnail step failed:', err);
    }

    const originalUrl = getPublicUrl(originalPath);
    const watermarkedUrl = getPublicUrl(watermarkedPath);
    const thumbnailUrl = getPublicUrl(thumbnailPath);

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
    console.error('🔥 Upload API error:', error);
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