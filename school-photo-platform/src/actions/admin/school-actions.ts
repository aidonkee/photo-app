'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Get all schools for the logged-in admin (or super admin)
 */
export async function getSchools() {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const whereCondition: any = {};
    // Если это обычный админ, показываем только его школы
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
    console.error('Error fetching schools:', error);
    throw new Error('Failed to fetch schools');
  }
}

/**
 * Get a single school by ID with Security Check
 */
export async function getSchoolById(schoolId: string) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  const whereCondition: any = { id: schoolId };

  // ЗАЩИТА: Если обычный админ, ищем школу ТОЛЬКО с его adminId
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
    // Если школа не найдена или принадлежит другому админу
    redirect('/admin/dashboard');
  }

  return school;
}

/**
 * Create a new school
 */
export async function createSchoolAction(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { error: 'Unauthorized access' };
  }

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const primaryColor = (formData.get('primaryColor') as string) || '#f97316';
  const isKazakhEnabled = formData.get('isKazakhEnabled') === 'on';

  if (!name || !slug) {
    return { error: 'School name and slug are required' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { error: 'Slug must contain only lowercase letters, numbers, and hyphens' };
  }

  try {
    const existingSchool = await prisma.school.findUnique({
      where: { slug },
    });

    if (existingSchool) {
      return { error: 'A school with this slug already exists' };
    }

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        primaryColor,
        isKazakhEnabled,
        adminId: session.userId, // Привязываем к текущему админу
        isActive: true,
      },
    });

    revalidatePath('/admin/schools');

    return {
      success: true,
      schoolId: school.id,
      message: 'School created successfully',
    };
  } catch (error) {
    console.error('Error creating school:', error);
    return { error: 'Failed to create school. Please try again.' };
  }
}

/**
 * Update an existing school
 */
export async function updateSchoolAction(
  schoolId: string,
  prevState: any,
  formData: FormData
) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { error: 'Unauthorized access' };
  }

  const name = formData.get('name') as string;
  const primaryColor = formData.get('primaryColor') as string;

  if (!name) return { error: 'School name is required' };

  try {
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    // ЗАЩИТА: Проверка владельца
    if (!existingSchool) return { error: 'School not found' };
    if (session.role === 'ADMIN' && existingSchool.adminId !== session.userId) {
      return { error: 'Access denied' };
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        primaryColor: primaryColor || existingSchool.primaryColor,
      },
    });

    revalidatePath('/admin/schools');
    revalidatePath(`/admin/schools/${schoolId}`);

    return { success: true, message: 'School updated successfully' };
  } catch (error) {
    console.error('Error updating school:', error);
    return { error: 'Failed to update school. Please try again.' };
  }
}

/**
 * Delete a school
 */
export async function deleteSchoolAction(schoolId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized access');
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

    // ЗАЩИТА: Проверка владельца
    if (!school) throw new Error('School not found');
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    if (school._count.classrooms > 0) {
      throw new Error('Cannot delete school with existing classrooms. Please delete classrooms first.');
    }

    await prisma.school.delete({
      where: { id: schoolId },
    });

    revalidatePath('/admin/schools');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting school:', error);
    throw new Error(error.message || 'Failed to delete school');
  }
}

/**
 * Toggle school active status
 */
export async function toggleSchoolStatus(schoolId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized access');
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    // ЗАЩИТА: Проверка владельца
    if (!school) throw new Error('School not found');
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: { isActive: !school.isActive },
    });

    revalidatePath('/admin/schools');
    revalidatePath(`/admin/schools/${schoolId}`);

    return { success: true };
  } catch (error) {
    console.error('Error toggling school status:', error);
    throw new Error('Failed to update school status');
  }
}

/**
 * Get school statistics for the admin dashboard
 */
export async function getSchoolStats() {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  // ЗАЩИТА: Статистика только по своим школам
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
    console.error('Error fetching school stats:', error);
    throw new Error('Failed to fetch statistics');
  }
}