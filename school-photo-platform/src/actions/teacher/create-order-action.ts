'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PhotoFormat, OrderStatus } from '@prisma/client';

export type CreateOrderPayload = {
  parentName: string;
  parentSurname: string;
  parentPhone?: string;
  items: {
    photoId: string;
    photoUrl: string;
    format: PhotoFormat;
    quantity: number;
    pricePerUnit: number;
  }[];
  totalSum: number;
};

export async function createTeacherOrderAction(data: CreateOrderPayload) {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    throw new Error('Unauthorized');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  // Double check classroom allows creating (optional, usually locked means no changes)
  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    select: { isLocked: true }
  });

  if (classroom?.isLocked) {
    throw new Error('Класс заблокирован. Изменения невозможны.');
  }

  try {
    const newOrder = await prisma.order.create({
      data: {
        classId,
        parentName: data.parentName,
        parentSurname: data.parentSurname,
        parentPhone: data.parentPhone || null,
        status: OrderStatus.APPROVED_BY_TEACHER, // Immediately approved as the teacher entered it
        totalSum: data.totalSum,
        items: {
          create: data.items.map(item => ({
            photoId: item.photoId,
            photoUrl: item.photoUrl,
            format: item.format,
            quantity: item.quantity,
            price: item.pricePerUnit,
            subtotal: item.pricePerUnit * item.quantity,
          }))
        }
      }
    });

    revalidatePath('/teacher-dashboard');

    return { success: true, orderId: newOrder.id };
  } catch (error: any) {
    console.error('Error creating teacher order:', error);
    throw new Error(error.message || 'Failed to create order');
  }
}
