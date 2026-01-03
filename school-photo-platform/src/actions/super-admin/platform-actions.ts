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
      // Count all schools
      prisma.school.count(),

      // Count all admin users
      prisma.user.count({
        where: { role: 'ADMIN' },
      }),

      // Count all orders
      prisma.order.count(),

      // Calculate total revenue
      prisma.order.aggregate({
        _sum: {
          totalSum:true,
        },
        where: {
          status:'COMPLETED',
        },
      }),
    ]);

    const totalRevenueDecimal = revenueData._sum.totalSum;
    const totalRevenue = totalRevenueDecimal ? Number(totalRevenueDecimal) : 0;

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
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName:  true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            schools: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
export async function createPhotographerAction(
  prevState: any,
  formData: FormData
) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    return {
      error: 'Unauthorized access',
    };
  }

  // Extract form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData. get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = formData.get('phone') as string;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return {
      error: 'Email, password, first name, and last name are required',
    };
  }

  if (! email.includes('@')) {
    return {
      error: 'Please enter a valid email address',
    };
  }

  if (password.length < 8) {
    return {
      error:  'Password must be at least 8 characters long',
    };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        error:  'A user with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone:  phone || null,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Revalidate the admins page
    revalidatePath('/admins');

    return {
      success: true,
      message:  'Photographer created successfully',
    };
  } catch (error) {
    console.error('Error creating photographer:', error);
    return {
      error: 'Failed to create photographer.  Please try again.',
    };
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

    if (!admin) {
      throw new Error('Admin not found');
    }

    await prisma.user.update({
      where: { id: adminId },
      data: { isActive: !admin.isActive },
    });

    revalidatePath('/admins');

    return { success: true };
  } catch (error) {
    console.error('Error toggling admin status:', error);
    throw new Error('Failed to update admin status');
  }
}