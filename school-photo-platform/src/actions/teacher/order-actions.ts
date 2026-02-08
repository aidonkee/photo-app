'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Prisma, OrderStatus } from '@prisma/client';

export type TeacherOrder = {
  id: string;
  parentName: string;
  parentSurname: string;
  parentPhone: string | null;
  status: string;
  totalAmount: number;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    format: string;
    pricePerUnit: number;
    photo: {
      id: string;
      watermarkedUrl: string;
      thumbnailUrl: string | null;
      alt: string | null;
      width: number;
      height: number;
    };
  }[];
  isPaid: boolean;
  canEdit?: boolean; // разрешено ли учителю редактировать (isEditAllowed)
};

/**
 * Get all orders for the teacher's classroom
 */
export async function getTeacherOrders(): Promise<TeacherOrder[]> {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    select: { isEditAllowed: true },
  });

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
      parentPhone: order.parentPhone,
      status: order.status,
      totalAmount: Number(order.totalSum),
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        format: item.format,
        pricePerUnit: Number(item.price),
        photo: item.photo,
      })),
      isPaid: (order as any).isPaid,
      canEdit: classroom?.isEditAllowed ?? false,
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

  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    select: { isEditAllowed: true },
  });

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        classId,
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
      totalAmount: Number(order.totalSum),
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        format: item.format,
        pricePerUnit: Number(item.price),
        photo: item.photo,
      })),
      isPaid: (order as any).isPaid,
      canEdit: classroom?.isEditAllowed ?? false,
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
    // Fetch order with classroom to check isLocked
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        classroom: {
          select: { isLocked: true },
        },
      },
    });

    if (!order || order.classId !== classId) {
      throw new Error('Order not found or access denied');
    }

    // Check if classroom is locked
    if (order.classroom.isLocked) {
      throw new Error('Класс заблокирован. Изменения невозможны.');
    }

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

/**
 * Toggle Order Payment Status
 */
export async function toggleOrderPaymentStatus(orderId: string, isPaid: boolean) {
  const session = await getSession();

  // Allow ADMIN, SUPER_ADMIN, and TEACHER to toggle payment status
  if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  // Fetch order with classroom to check ownership and isLocked
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      classroom: {
        select: { id: true, isLocked: true },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // If TEACHER, verify ownership
  if (session.role === 'TEACHER') {
    const classId = session.classId;
    if (!classId) throw new Error('Invalid session: No classroom ID');

    if (order.classId !== classId) {
      throw new Error('Access denied');
    }
  }

  // Check if classroom is locked (unless SUPER_ADMIN)
  if (order.classroom.isLocked && session.role !== 'SUPER_ADMIN') {
    throw new Error('Класс заблокирован. Изменения невозможны.');
  }

  try {
    const result = await prisma.order.update({
      where: { id: orderId },
      data: { isPaid } as any, // Type assertion to bypass stale Prisma types
    });

    return { success: true, isPaid: (result as any).isPaid };
  } catch (error: any) {
    console.error('Error toggling payment status:', error);
    throw new Error(error.message || 'Failed to update payment status');
  }
}

/**
 * Decrease quantity of an order item (per unit). If quantity reaches 0, the item is removed.
 * Requires: teacher session, same class, classroom.isEditAllowed = true, order not LOCKED/COMPLETED.
 */
export async function decreaseOrderItemQuantity(orderItemId: string, delta: number = 1) {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    throw new Error('Unauthorized');
  }

  const classId = session.classId;

  if (!classId) {
    throw new Error('Invalid session: No classroom ID');
  }

  if (delta <= 0) {
    throw new Error('Delta must be positive');
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    select: { isEditAllowed: true },
  });

  if (!classroom || !classroom.isEditAllowed) {
    throw new Error('Edit permission not granted. Please request access from administrator.');
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: true,
        },
      });

      if (!item) {
        throw new Error('Order item not found');
      }

      if (item.order.classId !== classId) {
        throw new Error('Access denied');
      }

      if (item.order.status === OrderStatus.LOCKED || item.order.status === OrderStatus.COMPLETED) {
        throw new Error('Order is locked and cannot be edited');
      }

      const newQty = item.quantity - delta;
      if (newQty < 0) {
        throw new Error('Quantity cannot be negative');
      }

      if (newQty === 0) {
        await tx.orderItem.delete({
          where: { id: orderItemId },
        });
      } else {
        await tx.orderItem.update({
          where: { id: orderItemId },
          data: {
            quantity: newQty,
            subtotal: item.price.mul(new Prisma.Decimal(newQty)),
          },
        });
      }

      const totals = await tx.orderItem.aggregate({
        _sum: { subtotal: true },
        where: { orderId: item.orderId },
      });

      const totalSum = totals._sum.subtotal ?? new Prisma.Decimal(0);

      const updatedOrder = await tx.order.update({
        where: { id: item.orderId },
        data: {
          totalSum,
        },
      });

      return {
        newQuantity: Math.max(newQty, 0),
        totalAmount: Number(totalSum),
        orderStatus: updatedOrder.status,
      };
    });

    return { success: true, ...result };
  } catch (error: any) {
    console.error('Error decreasing order item quantity:', error);
    throw new Error(error.message || 'Failed to update order item');
  }
}