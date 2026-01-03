'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export type TeacherOrder = {
  id: string;
  parentName: string;
  parentSurname: string;
  // parentEmail удален, так как его нет в БД
  parentPhone: string | null;
  status: string;
  totalAmount: number; // Мы смапим это из totalSum
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    format: string;
    pricePerUnit: number; // Мы смапим это из price
    photo: {
      id: string;
      watermarkedUrl: string;
      thumbnailUrl: string | null;
      alt: string | null;
      width: number;
      height: number;
    };
  }[];
};

/**
 * Get all orders for the teacher's classroom
 */
export async function getTeacherOrders(): Promise<TeacherOrder[]> {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login'); // Или /teacher-login, проверь свой роутинг
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    const orders = await prisma.order.findMany({
      where: { classId },
      include: {
        items: {
          include: {
            photo: {
              select: {
                id: true,
                watermarkedUrl: true,
                thumbnailUrl: true,
                alt: true,
                width: true,
                height: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      id: order.id,
      parentName: order.parentName,
      parentSurname: order.parentSurname,
      // parentEmail нет в БД, используем заглушку или удаляем
      parentPhone: order.parentPhone,
      status: order.status,
      // Преобразуем Decimal (totalSum) в number
      totalAmount: Number(order.totalSum),
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        format: item.format,
        // Преобразуем Decimal (price) в number
        pricePerUnit: Number(item.price), 
        photo: item.photo,
      })),
    }));
  } catch (error) {
    console.error('Error fetching teacher orders:', error);
    throw new Error('Failed to load orders');
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(orderId: string): Promise<TeacherOrder | null> {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        classId, // Ensure teacher can only access their classroom's orders
      },
      include: {
        items: {
          include: {
            photo: {
              select: {
                id: true,
                watermarkedUrl: true,
                thumbnailUrl: true,
                alt: true,
                width: true,
                height: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      parentName: order.parentName,
      parentSurname: order.parentSurname,
      parentPhone: order.parentPhone,
      status: order.status,
      // Исправлено: totalSum -> totalAmount
      totalAmount: Number(order.totalSum),
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        format: item.format,
        // Исправлено: price -> pricePerUnit
        pricePerUnit: Number(item.price),
        photo: item.photo,
      })),
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to load order');
  }
}

/**
 * Approve an order (Teacher confirms it)
 */
export async function approveOrderAction(orderId: string) {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    throw new Error('Unauthorized');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  try {
    // Verify the order belongs to this classroom
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.classId !== classId) {
      throw new Error('Order not found or access denied');
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'APPROVED_BY_TEACHER',
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error approving order:', error);
    throw new Error(error.message || 'Failed to approve order');
  }
}