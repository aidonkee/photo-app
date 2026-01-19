'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Create an edit request
 */
export async function createEditRequestAction(
  prevState: any,
  formData: FormData
) {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    return { error: 'Unauthorized' };
  }

  const classId = session.classId;

  if (!classId) {
    return { error: 'Invalid session' };
  }

  const reason = formData.get('reason') as string;

  if (!reason || reason.trim().length === 0) {
    return { error: 'Please provide a reason for the edit request' };
  }

  if (reason.trim().length < 10) {
    return {
      error: 'Please provide a more detailed reason (at least 10 characters)',
    };
  }

  try {
    // Check if there's already a pending request
    const existingPendingRequest = await prisma.editRequest.findFirst({
      where: {
        classId,
        status: 'PENDING',
      },
    });

    if (existingPendingRequest) {
      return {
        error: 
          'You already have a pending edit request.  Please wait for the administrator to respond.',
      };
    }

    // Create the edit request
    await prisma.editRequest.create({
      data: {
        classId,
        reason:  reason.trim(),
        status: 'PENDING',
      },
    });

    revalidatePath('/teacher-dashboard');

    return {
      success: true,
      message: 
        'Edit request submitted successfully.  The administrator will review it soon.',
    };
  } catch (error) {
    console.error('Error creating edit request:', error);
    return {
      error: 'Failed to submit edit request. Please try again.',
    };
  }
}

/**
 * Get all edit requests for the teacher's classroom
 */
export async function getEditRequests() {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    const requests = await prisma.editRequest. findMany({
      where: { classId },
      orderBy:  { createdAt: 'desc' },
    });

    return requests;
  } catch (error) {
    console.error('Error fetching edit requests:', error);
    throw new Error('Failed to load edit requests');
  }
}