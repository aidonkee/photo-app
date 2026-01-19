'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { uploadFile, getPublicUrl } from '@/lib/storage';
import { addWatermark, createThumbnail } from '@/lib/watermark';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Ограничиваем конкурентность, чтобы не перегружать сервер при множественной загрузке
sharp.concurrency(1);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getPhotos(classId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    // ЗАЩИТА: Проверяем владельца (SUPER_ADMIN может видеть всё)
    if (!classroom) {
      throw new Error('Classroom not found');
    }
    if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    const photos = await prisma.photo.findMany({
      where: { classId },
      orderBy: { uploadedAt: 'desc' },
    });

    return photos;
  } catch (error) {
    console.error('Error fetching photos:', error);
    throw new Error('Failed to fetch photos');
  }
}

/**
 * Upload SINGLE photo (called multiple times by uploader)
 * OPTIMIZED for sequential upload to prevent server overload
 */
export async function uploadPhotoAction(
  classId: string,
  formData: FormData
): Promise<{
  success?: boolean;
  uploaded?: number;
  error?: string;
}> {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { error: 'Unauthorized access' };
  }

  try {
    // Verify classroom ownership ONCE
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    // ЗАЩИТА: Проверяем владель��а (SUPER_ADMIN может загружать везде)
    if (!classroom) {
      return { error: 'Classroom not found' };
    }
    if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
      return { error: 'Access denied' };
    }

    // Extract SINGLE file
    const file = formData.get('file') as File;

    if (!file) {
      return { error: 'No file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { error: `Invalid file type: ${file.type}` };
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
    }

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate unique filename
      const fileId = uuidv4();
      const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase();

      // 1. Upload ORIGINAL
      const originalPath = `originals/${classId}/${fileId}.${fileExtension}`;
      console.log('📤 Uploading ORIGINAL:', { path: originalPath, size: buffer.length, type: file.type });
      await uploadFile(buffer, originalPath, file.type || 'image/jpeg');

      // 2. Add watermark (с детальным логированием + резервный путь)
      let watermarkedBuffer: Buffer;
      let width = 0;
      let height = 0;
      let size = 0;

      try {
        const wmResult = await addWatermark(buffer);
        watermarkedBuffer = wmResult.buffer;
        width = wmResult.width;
        height = wmResult.height;
        size = wmResult.size;
        console.log('✅ Watermark success:', { width, height, size });
      } catch (wmErr: any) {
        console.error('❌ addWatermark failed. Fallback to JPEG. Reason:', wmErr?.message || wmErr);
        // Резервный вариант: конвертируем оригинал в JPEG, чтобы watermarked не был пуст
        const meta = await sharp(buffer).metadata();
        width = meta.width || 0;
        height = meta.height || 0;
        watermarkedBuffer = await sharp(buffer).jpeg({ quality: 85, progressive: true }).toBuffer();
        size = watermarkedBuffer.length;
        console.log('⚠️ Fallback JPEG generated:', { width, height, size });
      }

      // 3. Upload WATERMARKED
      const watermarkedPath = `watermarked/${classId}/${fileId}.jpg`;
      console.log('📤 Uploading WATERMARKED:', { path: watermarkedPath, size: watermarkedBuffer.length });
      await uploadFile(watermarkedBuffer, watermarkedPath, 'image/jpeg');

      // 4. Create THUMBNAIL
      console.log('🔧 Creating THUMBNAIL from watermarked...');
      let thumbnailBuffer: Buffer;
      try {
        thumbnailBuffer = await createThumbnail(watermarkedBuffer);
      } catch (thumbErr: any) {
        console.error('❌ createThumbnail failed. Fallback to simple resize. Reason:', thumbErr?.message || thumbErr);
        thumbnailBuffer = await sharp(watermarkedBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
      }
      const thumbnailPath = `thumbnails/${classId}/${fileId}.jpg`;
      console.log('📤 Uploading THUMBNAIL:', { path: thumbnailPath, size: thumbnailBuffer.length });
      await uploadFile(thumbnailBuffer, thumbnailPath, 'image/jpeg');

      // 5. Get public URLs
      const watermarkedUrl = getPublicUrl(watermarkedPath);
      const thumbnailUrl = getPublicUrl(thumbnailPath);
      console.log('🔗 Public URLs:', { watermarkedUrl, thumbnailUrl });

      // 6. Create database record
      await prisma.photo.create({
        data: {
          classId,
          originalUrl: originalPath,     // путь в сторидж (может быть приватным по политикам)
          watermarkedUrl,                // публичный URL
          thumbnailUrl,                  // публичный URL
          width,
          height,
          fileSize: size,
          mimeType: 'image/jpeg',
          alt: file.name.replace(/\.[^/.]+$/, ''),
          tags: [],
        },
      });

      // Revalidate path (but only once per batch in real scenario)
      revalidatePath(`/admin/schools/${classroom.schoolId}/classrooms/${classId}`);

      return {
        success: true,
        uploaded: 1,
      };
    } catch (fileError: any) {
      console.error(`Error processing file ${file.name}:`, fileError);
      return {
        error: fileError.message || 'Failed to process file',
      };
    }
  } catch (error: any) {
    console.error('Error in upload action:', error);
    return {
      error: error.message || 'Failed to upload photo',
    };
  }
}

export async function deletePhotoAction(photoId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized access');
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        classroom: {
          include: { school: true },
        },
        _count: {
          select: { orderItems: true },
        },
      },
    });

    // ЗАЩИТА: Проверяем владельца (SUPER_ADMIN может удалять всё)
    if (!photo) {
      throw new Error('Photo not found');
    }
    if (session.role === 'ADMIN' && photo.classroom.school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    if (photo._count.orderItems > 0) {
      throw new Error('Cannot delete photo that is part of an order');
    }

    // Extract paths from URLs (watermarked/thumbnail - полные публичные URL, вытаскиваем относительные пути)
    const watermarkedPath = photo.watermarkedUrl.split('/storage/v1/object/public/school-photos/')[1];
    const thumbnailPath = photo.thumbnailUrl?.split('/storage/v1/object/public/school-photos/')[1];

    const pathsToDelete = [photo.originalUrl];
    if (watermarkedPath) pathsToDelete.push(watermarkedPath);
    if (thumbnailPath) pathsToDelete.push(thumbnailPath);

    const { error: storageError } = await supabase.storage.from('school-photos').remove(pathsToDelete);

    if (storageError) {
      console.error('Supabase storage delete error:', storageError);
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    revalidatePath(`/admin/schools/${photo.classroom.schoolId}/classrooms/${photo.classId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    throw new Error(error.message || 'Failed to delete photo');
  }
}

export async function getPhotoStats(classId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    // ЗАЩИТА: Проверяем владельца (SUPER_ADMIN может видеть всё)
    if (!classroom) {
      throw new Error('Classroom not found');
    }
    if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    const [totalPhotos, totalSize] = await Promise.all([
      prisma.photo.count({
        where: { classId },
      }),
      prisma.photo.aggregate({
        where: { classId },
        _sum: {
          fileSize: true,
        },
      }),
    ]);

    return {
      totalPhotos,
      totalSize: totalSize._sum.fileSize || 0,
    };
  } catch (error) {
    console.error('Error fetching photo stats:', error);
    throw new Error('Failed to fetch photo statistics');
  }
}

/**
 * Загрузка фото в конкретный класс (автоматически находит или создает класс по имени)
 */
export async function uploadSchoolPhotoAction(
  schoolId: string,
  className: string,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    // 1. Находим или создаем класс
    let classroom = await prisma.classroom.findFirst({
      where: { schoolId, name: className },
    });

    if (!classroom) {
      classroom = await prisma.classroom.create({
        data: {
          name: className,
          schoolId: schoolId,
          teacherLogin: `sch${schoolId.substring(0, 4)}-${className.toLowerCase().replace(/\s+/g, '')}`,
          teacherPassword: uuidv4().substring(0, 8),
        },
      });
    }

    // 2. Вызываем существующую логику загрузки (переиспользуем твой код)
    return await uploadPhotoAction(classroom.id, formData);
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Bulk delete photos
 * Skips photos that are part of orders
 */
export async function deletePhotosAction(
  classId: string,
  photoIds: string[]
): Promise<{
  success: boolean;
  deleted: number;
  skipped: number;
  errors: string[];
}> {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized access');
  }

  if (!photoIds || photoIds.length === 0) {
    return {
      success: false,
      deleted: 0,
      skipped: 0,
      errors: ['No photos selected'],
    };
  }

  try {
    // Verify classroom ownership
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    // ЗАЩИТА: Проверяем владельца (SUPER_ADMIN может удалять везде)
    if (!classroom) {
      throw new Error('Classroom not found');
    }
    if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    // Fetch all photos with order info
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        classId,
      },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    let deletedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const pathsToDelete: string[] = [];

    // Process each photo
    for (const photo of photos) {
      // Skip photos that are in orders
      if (photo._count.orderItems > 0) {
        skippedCount++;
        continue;
      }

      try {
        // Extract storage paths
        const watermarkedPath = photo.watermarkedUrl.split(
          '/storage/v1/object/public/school-photos/'
        )[1];
        const thumbnailPath = photo.thumbnailUrl?.split(
          '/storage/v1/object/public/school-photos/'
        )[1];

        // Collect paths for batch deletion
        pathsToDelete.push(photo.originalUrl);
        if (watermarkedPath) pathsToDelete.push(watermarkedPath);
        if (thumbnailPath) pathsToDelete.push(thumbnailPath);

        // Delete from database
        await prisma.photo.delete({
          where: { id: photo.id },
        });

        deletedCount++;
      } catch (err: any) {
        console.error(`Error deleting photo ${photo.id}:`, err);
        errors.push(`Failed to delete photo: ${photo.alt || photo.id}`);
      }
    }

    // Batch delete from Supabase Storage
    if (pathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('school-photos')
        .remove(pathsToDelete);

      if (storageError) {
        console.error('Supabase bulk delete error:', storageError);
        errors.push('Some files may not have been deleted from storage');
      }
    }

    // Revalidate to update UI immediately
    revalidatePath(`/admin/schools/${classroom.schoolId}/classrooms/${classId}`);

    return {
      success: true,
      deleted: deletedCount,
      skipped: skippedCount,
      errors,
    };
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    throw new Error(error.message || 'Failed to delete photos');
  }
}