'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

// ✅ ОБНОВЛЕНО:  Только A4 и A5
function validatePricing(formData: FormData): {
  priceA4: number;
  priceA5: number;
} | { error: string } {
  const priceA4 = parseInt(formData.get('priceA4') as string) || 1500;
  const priceA5 = parseInt(formData.get('priceA5') as string) || 1000;

  if (priceA4 < 0 || priceA5 < 0) {
    return { error: 'Цены не могут быть отрицательными' };
  }

  return { priceA4, priceA5 };
}

/**
 * Получить все школы для админа
 */
export async function getSchools() {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const whereCondition: any = {};
    if (session.role === 'ADMIN') {
      whereCondition.adminId = session.userId;
    }

    const schools = await prisma.school.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: {
            classrooms: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return schools;
  } catch (error) {
    console.error('Ошибка загрузки школ:', error);
    throw new Error('Не удалось загрузить школы');
  }
}

/**
 * Получить школу по ID
 */
export async function getSchoolById(schoolId: string) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  const whereCondition: any = { id: schoolId };

  if (session.role === 'ADMIN') {
    whereCondition.adminId = session.userId;
  }

  const school = await prisma.school.findUnique({
    where: whereCondition,
    include: {
      _count: {
        select: { classrooms: true },
      },
    },
  });

  if (!school) {
    redirect('/admin/dashboard');
  }

  return school;
}

/**
 * Создать новую школу
 */
export async function createSchoolAction(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { error: 'Нет доступа' };
  }

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const primaryColor = (formData.get('primaryColor') as string) || '#f97316';
  const isKazakhEnabled = formData.get('isKazakhEnabled') === 'on';

  // Валидация цен
  const pricing = validatePricing(formData);
  if ('error' in pricing) {
    return pricing;
  }

  if (!name || !slug) {
    return { error: 'Название и slug обязательны' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { error: 'Slug может содержать только латинские буквы, цифры и дефис' };
  }

  try {
    const existingSchool = await prisma.school.findUnique({
      where: { slug },
    });

    if (existingSchool) {
      return { error: 'Школа с таким slug уже существует' };
    }

    const school = await prisma.school.create({
      data: {
        name,
        slug, 
        primaryColor,
        isKazakhEnabled,
        adminId: session.userId,
        isActive: true,
        priceA4: pricing.priceA4,
        priceA5: pricing.priceA5,
      },
    });

    revalidatePath('/admin/schools');

    return {
      success: true,
      schoolId: school.id,
      message: 'Школа успешно создана',
    };
  } catch (error) {
    console.error('Ошибка создания школы:', error);
    return { error: 'Не удалось создать школу.  Попробуйте снова.' };
  }
}

/**
 * Обновить школу
 */
export async function updateSchoolAction(
  schoolId: string,
  prevState: any,
  formData: FormData
) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { error: 'Нет доступа' };
  }

  const name = formData.get('name') as string;
  const primaryColor = formData.get('primaryColor') as string;

  // Валидация цен
  const pricing = validatePricing(formData);
  if ('error' in pricing) {
    return pricing;
  }

  if (!name) return { error: 'Название школы обязательно' };

  try {
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) return { error: 'Школа не найдена' };
    if (session.role === 'ADMIN' && existingSchool.adminId !== session.userId) {
      return { error: 'Доступ запрещен' };
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        primaryColor: primaryColor || existingSchool.primaryColor,
        priceA4: pricing.priceA4,
        priceA5: pricing.priceA5,
      },
    });

    revalidatePath('/admin/schools');
    revalidatePath(`/admin/schools/${schoolId}`);

    return { success: true, message: 'Школа успешно обновлена' };
  } catch (error) {
    console.error('Ошибка обновления школы:', error);
    return { error: 'Не удалось обновить школу. Попробуйте снова.' };
  }
}

/**
 * Удалить школу
 */
export async function deleteSchoolAction(schoolId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Нет доступа');
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: { classrooms: true },
        },
      },
    });

    if (!school) throw new Error('Школа не найдена');
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      throw new Error('Доступ запрещен');
    }

    // ✅ Cascade delete allowed
    await prisma.school.delete({
      where: { id: schoolId },
    });

    revalidatePath('/admin/schools');
    return { success: true };
  } catch (error: any) {
    console.error('Ошибка удаления школы:', error);
    throw new Error(error.message || 'Не удалось удалить школу');
  }
}

/**
 * Переключить статус школы
 */
export async function toggleSchoolStatus(schoolId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Нет доступа');
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) throw new Error('Школа не найдена');
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      throw new Error('Доступ запрещен');
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: { isActive: !school.isActive },
    });

    revalidatePath('/admin/schools');
    revalidatePath(`/admin/schools/${schoolId}`);

    return { success: true };
  } catch (error) {
    console.error('Ошибка переключения статуса:', error);
    throw new Error('Не удалось обновить статус школы');
  }
}

/**
 * Получить статистику школ
 */
export async function getSchoolStats() {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  const whereFilter = session.role === 'ADMIN' ? { adminId: session.userId } : {};

  try {
    const [totalSchools, totalClassrooms, totalPhotos, totalOrders] =
      await Promise.all([
        prisma.school.count({ where: whereFilter }),
        prisma.classroom.count({
          where: { school: whereFilter },
        }),
        prisma.photo.count({
          where: { classroom: { school: whereFilter } },
        }),
        prisma.order.count({
          where: { classroom: { school: whereFilter } },
        }),
      ]);

    return {
      totalSchools,
      totalClassrooms,
      totalPhotos,
      totalOrders,
    };
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    throw new Error('Не удалось загрузить статистику');
  }
}