'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Получить все заказы школы
 */
export async function getSchoolOrders(schoolId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    // Проверка прав доступа к школе
    const school = await prisma.school.findUnique({
      where: { id:  schoolId },
      select: { adminId: true },
    });

    if (!school) {
      redirect('/admin/dashboard');
    }

    // Если обычный админ — проверяем владельца
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      redirect('/admin/dashboard');
    }

    // Получаем заказы с информацией о классе
    const orders = await prisma.order. findMany({
      where: {
        classroom: {
          schoolId:  schoolId,
        },
      },
      include:  {
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt:  'desc',
      },
    });

    return orders;
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    throw new Error('Не удалось загрузить заказы');
  }
}

/**
 * Получить детали конкретного заказа
 */
export async function getOrderDetails(orderId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const order = await prisma.order. findUnique({
      where:  { id: orderId },
      include: {
        classroom: {
          include: {
            school: {
              select: {
                id:  true,
                name: true,
                adminId: true,
              },
            },
          },
        },
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
          orderBy: {
            createdAt:  'asc',
          },
        },
      },
    });

    if (!order) {
      redirect('/admin/dashboard');
    }

    // Проверка прав доступа
    if (session.role === 'ADMIN' && order.classroom.school.adminId !== session.userId) {
      redirect('/admin/dashboard');
    }

    return order;
  } catch (error) {
    console.error('Ошибка загрузки деталей заказа:', error);
    throw new Error('Не удалось загрузить заказ');
  }
}

/**
 * Обновить статус заказа
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'APPROVED_BY_TEACHER' | 'LOCKED' | 'COMPLETED'
) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session. role !== 'SUPER_ADMIN')) {
    return { error: 'Нет доступа' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include:  {
        classroom: {
          include: {
            school: {
              select: { adminId: true },
            },
          },
        },
      },
    });

    if (!order) {
      return { error: 'Заказ не найден' };
    }

    if (session.role === 'ADMIN' && order.classroom.school.adminId !== session.userId) {
      return { error: 'Доступ запрещен' };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    return { error:  'Не удалось обновить статус' };
  }
}