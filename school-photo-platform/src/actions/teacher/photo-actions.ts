'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Delete photo (Teacher - only if edit permission is granted)
 * SECURITY: Validates that teacher has isEditAllowed permission
 */
export async function deletePhotoAsTeacherAction(photoId: string) {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    throw new Error('Unauthorized access');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    // Get classroom to check edit permissions
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      select: {
        id: true,
        isEditAllowed: true,
        schoolId: true,
      },
    });

    // ЗАЩИТА: Проверяем, что учителю разрешено редактировать
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    if (!classroom.isEditAllowed) {
      throw new Error('Edit permission not granted. Please request access from administrator.');
    }

    // Fetch photo and verify it belongs to this classroom
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    // ЗАЩИТА: Проверяем владение фото этим классом
    if (!photo) {
      throw new Error('Photo not found');
    }

    if (photo.classId !== classId) {
      throw new Error('Access denied - photo does not belong to your classroom');
    }

    // ЗАЩИТА: Запрещаем удаление фото, которые в заказах
    if (photo._count.orderItems > 0) {
      throw new Error('Cannot delete photo that is part of an order');
    }

    // Extract paths from URLs for storage deletion
    const watermarkedPath = photo.watermarkedUrl.split('/storage/v1/object/public/school-photos/')[1];
    const thumbnailPath = photo.thumbnailUrl?.split('/storage/v1/object/public/school-photos/')[1];

    const pathsToDelete = [photo.originalUrl];
    if (watermarkedPath) pathsToDelete.push(watermarkedPath);
    if (thumbnailPath) pathsToDelete.push(thumbnailPath);

    // Delete from Supabase Storage
    const { error: storageError } = await supabase
      .storage
      .from('school-photos')
      .remove(pathsToDelete);

    if (storageError) {
      console.error('Supabase storage delete error:', storageError);
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: photoId },
    });

    revalidatePath(`/teacher-dashboard`);
    revalidatePath(`/classroom/${classId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting photo (teacher):', error);
    throw new Error(error.message || 'Failed to delete photo');
  }
}

/**
 * Get photos for teacher's classroom
 */
export async function getTeacherClassroomPhotos() {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    const photos = await prisma.photo.findMany({
      where: { classId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    return photos;
  } catch (error) {
    console.error('Error fetching teacher photos:', error);
    throw new Error('Failed to load photos');
  }
}
