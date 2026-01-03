import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadFile, getPublicUrl } from '@/lib/storage';
import { addWatermark } from '@/lib/watermark';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('classId') as string;

    if (!file || !classId) {
      return NextResponse.json(
        { error: 'File and classId are required' },
        { status:  400 }
      );
    }

    // Verify classroom ownership
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include:  { school: true },
    });

    if (!classroom || classroom.school. adminId !== session.userId) {
      return NextResponse. json(
        { error: 'Access denied' },
        { status:  403 }
      );
    }

    // Convert to buffer
    const bytes = await file. arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique ID
    const fileId = uuidv4();
    const fileExtension = file.name.split('. ').pop() || 'jpg';

    // Upload original
    const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
    await uploadFile(buffer, originalPath, file.type);

    // Process and upload watermarked
    const { buffer: watermarkedBuffer, width, height, size } = await addWatermark(buffer);
    const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
    await uploadFile(watermarkedBuffer, watermarkedPath, 'image/jpeg');

    const watermarkedUrl = getPublicUrl(watermarkedPath);

    // Create database record
    const photo = await prisma.photo.create({
      data: {
        classId,
        originalUrl: originalPath,
        watermarkedUrl,
        thumbnailUrl: watermarkedUrl,
        width,
        height,
        fileSize: size,
        mimeType: 'image/jpeg',
        alt: file.name. replace(/\.[^/.]+$/, ''),
        tags: [],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: photo.id,
        url: watermarkedUrl,
        publicUrl: watermarkedUrl,
        path: watermarkedPath,
        size,
      },
    });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse. json(
      { error: error.message || 'Failed to upload file' },
      { status:  500 }
    );
  }
}