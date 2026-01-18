import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadFile, getPublicUrl } from '@/lib/storage';
import { addWatermark, createThumbnail } from '@/lib/watermark';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
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

    // Verify classroom ownership
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    if (!classroom || classroom.school.adminId !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique ID
    const fileId = uuidv4();
    const fileExtension = getFileExtension(file.name, file.type);

    // Paths
    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;

    // Upload original
    await uploadFile(buffer, originalPath, file.type || 'image/jpeg');

    // Process and upload watermarked
    const { buffer: watermarkedBuffer, width, height, size } = await addWatermark(buffer);
    await uploadFile(watermarkedBuffer, watermarkedPath, 'image/jpeg');

    // Process and upload thumbnail (from original to keep detail)
    const thumbnailBuffer = await createThumbnail(buffer);
    await uploadFile(thumbnailBuffer, thumbnailPath, 'image/jpeg');

    // Public URLs
    const originalUrl = getPublicUrl(originalPath);
    const watermarkedUrl = getPublicUrl(watermarkedPath);
    const thumbnailUrl = getPublicUrl(thumbnailPath);

    // Create database record
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
    console.error('Upload API error:', error);
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