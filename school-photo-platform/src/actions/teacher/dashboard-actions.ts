'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Get classroom details and statistics for teacher
 */
export async function getTeacherDashboardData() {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login'); // Внимание: убедись, что редирект ведет на правильный логин, если у тебя их два
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true,
          },
        },
        _count: {
          select: {
            photos: true,
            orders: true,
            editRequests: true,
          },
        },
      },
    });

    if (!classroom) {
      throw new Error('Classroom not found');
    }

    // Get order statistics
    const orders = await prisma.order.findMany({
      where: { classId },
      select: {
        status: true,
        totalSum: true, // ИСПРАВЛЕНО: было totalAmount
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (Number(order.totalSum) || 0), // ИСПРАВЛЕНО: totalSum + конвертация Decimal
      0
    );

    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    
    // ИСПРАВЛЕНО: статус в твоем Enum называется 'APPROVED_BY_TEACHER'
    const approvedOrders = orders.filter(
      (o) => o.status === 'APPROVED_BY_TEACHER'
    ).length;

    // Get pending edit requests
    const pendingEditRequests = await prisma.editRequest.count({
      where: {
        classId,
        status: 'PENDING',
      },
    });

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        isLocked: classroom.isLocked,
        lockedAt: classroom.lockedAt,
        isEditAllowed: classroom.isEditAllowed,
      },
      school: classroom.school,
      stats: {
        totalPhotos: classroom._count.photos,
        totalOrders: classroom._count.orders,
        pendingOrders,
        approvedOrders,
        totalRevenue,
        pendingEditRequests,
      },
    };
  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error);
    throw new Error('Failed to load dashboard data');
  }
}

/**
 * Get all photos for the teacher's classroom
 */
export async function getClassroomPhotos() {
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
      select: {
        id: true,
        watermarkedUrl: true,
        thumbnailUrl: true,
        alt: true,
        width: true,
        height: true,
        uploadedAt: true,
      },
    });

    return photos;
  } catch (error) {
    console.error('Error fetching classroom photos:', error);
    throw new Error('Failed to load photos');
  }
}

/**
 * Lock classroom for printing
 */
export async function lockClassroomAction() {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    throw new Error('Unauthorized');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    await prisma.classroom.update({
      where: { id: classId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error locking classroom:', error);
    throw new Error('Failed to lock classroom');
  }
}

/**
 * Unlock classroom
 */
export async function unlockClassroomAction() {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    throw new Error('Unauthorized');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    await prisma.classroom.update({
      where: { id: classId },
      data: {
        isLocked: false,
        lockedAt: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error unlocking classroom:', error);
    throw new Error('Failed to unlock classroom');
  }
}