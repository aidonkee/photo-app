'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Photo record data from client upload
 */
type PhotoRecordInput = {
  classId: string;
  originalUrl: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  alt?:  string | null;
};

/**
 * Save photo metadata to database after Supabase upload
 * This action ONLY handles DB writes - no file processing
 */
export async function savePhotoRecord(data: PhotoRecordInput) {
  // 1. Authentication check
  const session = await getSession();
  
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Admin access required');
  }

  // 2. Validate classroom exists and belongs to this admin
  const classroom = await prisma.classroom.findUnique({
    where: { id: data. classId },
    include: {
      school: {
        select: {
          id: true,
          adminId: true,
        },
      },
    },
  });

  if (!classroom) {
    throw new Error(`Classroom not found:  ${data.classId}`);
  }

  // 3. Authorization:  Check if this admin owns the school
  if (session.role === 'ADMIN' && classroom. school.adminId !== session.userId) {
    throw new Error('Forbidden: You do not have access to this classroom');
  }

  // 4. Validate input data
  if (!data.originalUrl || !data.width || ! data.height || !data.fileSize) {
    throw new Error('Invalid photo data:  missing required fields');
  }

  if (data.fileSize <= 0 || data.width <= 0 || data.height <= 0) {
    throw new Error('Invalid photo dimensions or file size');
  }

  try {
    // 5. Insert photo record into database
    // NOTE: watermarkedUrl = originalUrl for now (will be updated by background job later)
    const photo = await prisma.photo.create({
      data: {
        classId: data.classId,
        originalUrl: data.originalUrl,
        watermarkedUrl: data. originalUrl, // Temporary:  same as original
        thumbnailUrl: data.originalUrl,   // Temporary: same as original
        width: data.width,
        height: data.height,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        alt: data.alt || null,
        tags: [], // Empty for now, can be added later
      },
    });

    return {
      success: true,
      photoId: photo.id,
      originalUrl: photo.originalUrl,
    };
  } catch (error) {
    console.error('Failed to save photo record:', error);
    throw new Error('Database error: Failed to save photo metadata');
  }
}

/**
 * Batch revalidation after all uploads complete
 * Call this ONCE at the end of upload batch
 */
export async function revalidateClassroomPhotos(classId:  string, schoolId: string) {
  const session = await getSession();
  
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  try {
    // Revalidate classroom page
    revalidatePath(`/admin/schools/${schoolId}/classrooms/${classId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to revalidate paths:', error);
    // Don't throw - revalidation failure is not critical
    return { success: false };
  }
}