'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export async function loginAdminAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validation
  if (!email || !password) {
    return {
      error: 'Email and password are required',
    };
  }

  if (!email.includes('@')) {
    return {
      error: 'Please enter a valid email address',
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        error: 'Invalid email or password',
      };
    }

    // ДЛЯ АДМИНА ОСТАВЛЯЕМ BCRAZY (если они у тебя хешированные)
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return {
        error: 'Invalid email or password',
      };
    }

    await createSession(user.id, user.role);

    if (user.role === 'SUPER_ADMIN') {
      redirect('/dashboard');
    } else if (user.role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else {
      return {
        error: 'Unauthorized role',
      };
    }
  } catch (error: any) {
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Login error:', error);
    return {
      error: 'An error occurred during login. Please try again.',
    };
  }
}

export async function loginTeacherAction(prevState: any, formData: FormData) {
  const teacherLogin = formData.get('teacherLogin') as string;
  const teacherPassword = formData.get('teacherPassword') as string;

  // Validation
  if (!teacherLogin || !teacherPassword) {
    return {
      error: 'Login and password are required',
    };
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { teacherLogin },
    });

    if (!classroom) {
      return {
        error: 'Invalid login or password',
      };
    }

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Убрали bcrypt, поставили обычное сравнение строк
    if (teacherPassword !== classroom.teacherPassword) {
      return {
        error: 'Invalid login or password',
      };
    }
    // -------------------------

    // Create session
    await createSession(
      classroom.id,
      'TEACHER',
      classroom.schoolId,
      classroom.id
    );

    redirect('/teacher-dashboard');
  } catch (error: any) {
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('Teacher login error:', error);
    return {
      error: 'An error occurred during login. Please try again.',
    };
  }
}