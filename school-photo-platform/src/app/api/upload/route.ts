// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
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
    const buffer = Buffer.from(bytes);

    // Получаем размеры
    const meta = await sharp(buffer).metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    const fileId = uuidv4();
    const ext = file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
    const filePath = `originals/${classId}/${fileId}.${ext}`;

    // Загружаем ТОЛЬКО оригинал
    await uploadFileDirect(filePath, buffer, file.type || 'image/jpeg');
    
    const originalUrl = getPublicUrl(filePath);

    // Сохраняем в БД
    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl,
        watermarkedUrl: originalUrl, // Пока ставим тот же URL
        thumbnailUrl: originalUrl,
        width,
        height,
        fileSize: buffer.length,
        mimeType: file.type || 'image/jpeg',
        alt: file.name.replace(/\.[^/.]+$/, ''),
        tags: [],
      },
    });

    console.log('✅ Photo uploaded:', photo.id);

    return NextResponse.json({
      success: true,
      data: {
        id: photo.id,
        url: originalUrl,
        publicUrl: originalUrl,
        size: buffer.length,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}