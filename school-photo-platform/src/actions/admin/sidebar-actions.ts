'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Get schools with classrooms for sidebar navigation
 */
export async function getSchoolsWithClassrooms() {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const whereCondition: any = {};
    
    // ЗАЩИТА: Обычный админ видит только свои школы, SUPER_ADMIN видит все
    if (session.role === 'ADMIN') {
      whereCondition.adminId = session.userId;
    }
    
    const schools = await prisma.school. findMany({
      where: whereCondition,
      include:  {
        classrooms: {
          orderBy: {
            name: 'asc',
          },
          select: {
            id: true,
            name: true,
            isLocked: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return schools;
  } catch (error) {
    console.error('Error fetching schools for sidebar:', error);
    return [];
  }
}