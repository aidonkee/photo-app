'use server';

import { siteConfig } from '@/config/site';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { pgmq } from 'prisma-pgmq'
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'school-photos';
const WATERMARK_FILE = path.join(process.cwd(), 'public', 'watermark.png');

// SVG фоллбэк для watermark
const svgOverlay = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <pattern id="wm" patternUnits="userSpaceOnUse" width="400" height="400" patternTransform="rotate(-30)">
        <text x="20" y="200" font-size="48" font-family="Arial, sans-serif" fill="rgba(255,0,0,0.35)">
          sample
        </text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
  </svg>
`);

/**
 * Photo record data from client upload
 */
type PhotoRecordInput = {
  classId: string;
  originalUrl: string;
  originalPath: string; // путь в storage (originals/classId/filename.jpg)
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  alt?: string | null;
};

/**
 * Process uploaded photo: create watermark + thumbnail, save to DB
 */
export async function processAndSavePhoto(data: PhotoRecordInput) {
  // 1. Authentication check
  const session = await getSession();
  
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Admin access required');
  }

  // 2. Validate classroom exists and belongs to this admin
  const classroom = await prisma.classroom.findUnique({
    where: { id: data.classId },
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
    throw new Error(`Classroom not found: ${data.classId}`);
  }

  // 3. Authorization: Check if this admin owns the school
  if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
    throw new Error('Forbidden: You do not have access to this classroom');
  }

  // 4. Validate input data
  if (!data.originalUrl || !data.originalPath || !data.width || !data.height || !data.fileSize) {
    throw new Error('Invalid photo data: missing required fields');
  }

  pgmq.send(prisma, 'process-uploads', {type: 'process-photo', data: data})

  fetch(`${siteConfig.url}/api/worker`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
  }).catch(err => console.error('Trigger failed', err));

  return {
      success: true,
      // photoId: photo.id,
      // watermarkedUrl,
      // thumbnailUrl,
  };
  
}

/**
 * Batch revalidation after all uploads complete
 */
export async function revalidateClassroomPhotos(classId: string, schoolId: string) {
  const session = await getSession();
  
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  try {
    revalidatePath(`/admin/schools/${schoolId}/classrooms/${classId}`);
    revalidatePath(`/admin/schools/${schoolId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to revalidate paths:', error);
    return { success: false };
  }
}
