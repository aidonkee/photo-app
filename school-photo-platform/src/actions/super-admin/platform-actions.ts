'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Type definitions
export type PlatformStats = {
  totalSchools: number;
  totalAdmins: number;
  totalOrders: number;
  totalRevenue: number;
};

export type AdminWithCount = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    schools: number;
  };
};

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  try {
    const [totalSchools, totalAdmins, totalOrders, revenueData] = await Promise.all([
      prisma.school.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalSum: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    const totalRevenue = revenueData._sum.totalSum ? Number(revenueData._sum.totalSum) : 0;

    return {
      totalSchools,
      totalAdmins,
      totalOrders,
      totalRevenue,
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    throw new Error('Failed to fetch platform statistics');
  }
}

/**
 * Get list of all admin users with school counts
 */
export async function getAdminsList(): Promise<AdminWithCount[]> {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { schools: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins;
  } catch (error) {
    console.error('Error fetching admins list:', error);
    throw new Error('Failed to fetch administrators');
  }
}

/**
 * Create a new photographer (admin user)
 */
export async function createPhotographerAction(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized access' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = formData.get('phone') as string;

  if (!email || !password || !firstName || !lastName) {
    return { error: 'Все поля обязательны для заполнения' };
  }
  if (!email.includes('@')) {
    return { error: 'Введите корректный email' };
  }
  if (password.length < 8) {
    return { error: 'Пароль должен быть не менее 8 символов' };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'Пользователь с таким email уже существует' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'ADMIN',
        isActive: true,
      },
    });

    revalidatePath('/admins');
    return { success: true, message: 'Фотограф успешно создан' };
  } catch (error) {
    console.error('Error creating photographer:', error);
    return { error: 'Ошибка при создании фотографа' };
  }
}

/**
 * Toggle admin active status
 */
export async function toggleAdminStatus(adminId: string) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized access');
  }

  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { isActive: true },
    });

    if (!admin) throw new Error('Admin not found');

    await prisma.user.update({
      where: { id: adminId },
      data: { isActive: !admin.isActive },
    });

    revalidatePath('/admins');
    revalidatePath(`/admins/${adminId}`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling admin status:', error);
    throw new Error('Failed to update admin status');
  }
}

// ==========================================
// НОВАЯ ФУНКЦИЯ: Детальная статистика админа
// ==========================================

export async function getAdminDetails(adminId: string) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  try {
    // 1. Получаем данные админа
    const admin = await prisma.user.findUnique({
      where: { id: adminId, role: 'ADMIN' },
    });

    if (!admin) {
      return null;
    }

    // 2. Считаем общую статистику по всем школам этого админа
    // Используем aggregate для максимальной производительности
    const [schoolsCount, photosCount, ordersCount, revenueData, schoolsList] = await Promise.all([
      // Кол-во школ
      prisma.school.count({
        where: { adminId },
      }),
      // Кол-во фото во всех школах админа
      prisma.photo.count({
        where: { classroom: { school: { adminId } } },
      }),
      // Кол-во заказов
      prisma.order.count({
        where: { classroom: { school: { adminId } } },
      }),
      // Выручка (только COMPLETED)
      prisma.order.aggregate({
        where: {
          classroom: { school: { adminId } },
          status: 'COMPLETED'
        },
        _sum: { totalSum: true },
      }),
      // Список школ с их личной статистикой
      prisma.school.findMany({
        where: { adminId },
        include: {
          _count: {
            select: { classrooms: true },
          },
          // Чтобы посчитать выручку конкретной школы, нам придется подтянуть заказы
          // В продакшене лучше делать отдельным raw query, но для MVP так пойдет
          classrooms: {
            select: {
              orders: {
                where: { status: 'COMPLETED' },
                select: { totalSum: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Преобразуем список школ, считая выручку на лету
    const formattedSchools = schoolsList.map(school => {
      let schoolRevenue = 0;
      school.classrooms.forEach(classroom => {
        classroom.orders.forEach(order => {
          schoolRevenue += Number(order.totalSum);
        });
      });

      return {
        id: school.id,
        name: school.name,
        slug: school.slug,
        classroomsCount: school._count.classrooms,
        revenue: schoolRevenue,
      };
    });

    return {
      admin,
      stats: {
        schools: schoolsCount,
        photos: photosCount,
        orders: ordersCount,
        revenue: Number(revenueData._sum.totalSum || 0),
      },
      schools: formattedSchools,
    };

  } catch (error) {
    console.error('Error fetching admin details:', error);
    throw new Error('Failed to fetch admin details');
  }
}
