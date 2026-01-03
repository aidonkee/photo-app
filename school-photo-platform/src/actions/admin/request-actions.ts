'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EditRequestStatus } from '@prisma/client';

/**
 * Get all pending edit requests for the admin's schools
 */
export async function getPendingRequests() {
  const session = await getSession();

  // Allow both ADMIN and SUPER_ADMIN
  if (!session || (session. role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const requests = await prisma.editRequest.findMany({
      where: {
        classroom: {
          school: {
            adminId: session.userId,
          },
        },
        status: 'PENDING',
      },
      include: {
        classroom: {
          include: {
            school: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw new Error('Failed to fetch edit requests');
  }
}

/**
 * Get all edit requests (all statuses) for the admin's schools
 */
export async function getAllRequests() {
  const session = await getSession();

  // Allow both ADMIN and SUPER_ADMIN
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const requests = await prisma.editRequest. findMany({
      where: {
        classroom: {
          school: {
            adminId: session.userId,
          },
        },
      },
      include:  {
        classroom: {
          include: {
            school: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw new Error('Failed to fetch edit requests');
  }
}

/**
 * Resolve an edit request (approve or reject)
 */
export async function resolveRequestAction(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  adminNote?: string
) {
  const session = await getSession();

  // Allow both ADMIN and SUPER_ADMIN
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized access');
  }

  try {
    // Verify ownership
    const request = await prisma.editRequest.findUnique({
      where: { id: requestId },
      include: {
        classroom: {
          include:  {
            school: true,
          },
        },
      },
    });

    if (!request || request.classroom.school.adminId !== session.userId) {
      throw new Error('Request not found or access denied');
    }

    // Check if already resolved
    if (request.status !== 'PENDING') {
      throw new Error('Request has already been resolved');
    }

    // Update request status
    const updatedRequest = await prisma. editRequest.update({
      where: { id: requestId },
      data: {
        status:  status as EditRequestStatus,
        respondedAt: new Date(),
        adminNote:  adminNote || null,
      },
    });

    // If approved, enable edit permission for the classroom
    if (status === 'APPROVED') {
      await prisma.classroom.update({
        where: { id: request.classId },
        data: {
          isEditAllowed: true,
        },
      });
    }

    revalidatePath('/admin/requests');
    revalidatePath(`/admin/schools/${request.classroom.schoolId}/classrooms/${request.classId}`);

    return {
      success:  true,
      request: updatedRequest,
    };
  } catch (error:  any) {
    console.error('Error resolving request:', error);
    throw new Error(error. message || 'Failed to resolve request');
  }
}

/**
 * Get request statistics
 */
export async function getRequestStats() {
  const session = await getSession();

  // Allow both ADMIN and SUPER_ADMIN
  if (!session || (session. role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma. editRequest.count({
        where: {
          classroom: {
            school: {
              adminId: session.userId,
            },
          },
          status: 'PENDING',
        },
      }),
      prisma.editRequest.count({
        where: {
          classroom:  {
            school: {
              adminId: session.userId,
            },
          },
          status: 'APPROVED',
        },
      }),
      prisma.editRequest.count({
        where: {
          classroom: {
            school: {
              adminId: session.userId,
            },
          },
          status:  'REJECTED',
        },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  } catch (error) {
    console.error('Error fetching request stats:', error);
    throw new Error('Failed to fetch request statistics');
  }
}