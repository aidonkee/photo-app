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
    
    console.log('📸 ===== UPLOAD STARTED =====');
    console.log('File:', file.name);
    console.log('Size:', originalBuffer.length, 'bytes');
    console.log('ClassId:', classId);

    const fileId = uuidv4();
    const fileExtension = getFileExtension(file.name, file.type);

    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;

    // === ЭТАП 1: ОРИГИНАЛ ===
    console.log('\n📤 STEP 1: Uploading original...');
    try {
      await uploadFileDirect(originalPath, originalBuffer, file.type || 'image/jpeg');
      console.log('✅ Original uploaded successfully');
    } catch (err) {
      console.error('❌ FAILED to upload original:', err);
      throw err;
    }

    // === ЭТАП 2: WATERMARK ===
    console.log('\n🎨 STEP 2: Creating watermark...');
    let wm;
    try {
      wm = await addWatermark(originalBuffer);
      console.log('✅ Watermark created successfully');
      console.log('Dimensions:', wm.width, 'x', wm.height);
      console.log('Size:', wm.size, 'bytes');
    } catch (err) {
      console.error('❌ FAILED to create watermark:', err);
      throw new Error(`Watermark creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    console.log('\n📤 STEP 2b: Uploading watermarked...');
    try {
      await uploadFileDirect(watermarkedPath, wm.buffer, 'image/jpeg');
      console.log('✅ Watermarked uploaded successfully');
    } catch (err) {
      console.error('❌ FAILED to upload watermarked:', err);
      throw err;
    }

    // === ЭТАП 3: THUMBNAIL ===
    console.log('\n🖼️ STEP 3: Creating thumbnail...');
    try {
      const thumbnailBuffer = await createThumbnail(originalBuffer);
      console.log('✅ Thumbnail created successfully');
      console.log('Size:', thumbnailBuffer.length, 'bytes');
      
      await uploadFileDirect(thumbnailPath, thumbnailBuffer, 'image/jpeg');
      console.log('✅ Thumbnail uploaded successfully');
    } catch (err) {
      console.error('❌ FAILED with thumbnail:', err);
      // Не падаем, если thumbnail упал
    }

    // === ЭТАП 4: DATABASE ===
    console.log('\n💾 STEP 4: Saving to database...');
    const originalUrl = getPublicUrl(originalPath);
    const watermarkedUrl = getPublicUrl(watermarkedPath);
    const thumbnailUrl = getPublicUrl(thumbnailPath);

    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl,
        watermarkedUrl,
        thumbnailUrl,
        width: wm.width,
        height: wm.height,
        fileSize: wm.size,
        mimeType: 'image/jpeg',
        alt: file.name.replace(/\.[^/.]+$/, ''),
        tags: [],
      },
    });

    console.log('✅ Photo saved to DB, ID:', photo.id);
    console.log('===== UPLOAD COMPLETE =====\n');

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
          size: wm.size,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('\n🔥 ===== UPLOAD FAILED =====');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
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