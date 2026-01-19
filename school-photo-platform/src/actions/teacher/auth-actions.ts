'use server';

// import bcrypt from 'bcryptjs'; <--- УДАЛЕНО
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/auth';

/**
 * Teacher login action
 * Authenticates against Classroom table
 */
export async function teacherLoginAction(prevState: any, formData: FormData) {
  const teacherLogin = formData.get('teacherLogin') as string;
  const teacherPassword = formData.get('teacherPassword') as string;

  // Validation
  if (!teacherLogin || !teacherPassword) {
    return {
      error: 'Login and password are required',
    };
  }

  try {
    // Find classroom by teacherLogin
    const classroom = await prisma.classroom.findUnique({
      where: { teacherLogin },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!classroom) {
      return {
        error: 'Invalid login or password',
      };
    }

    // Verify password (DIRECT COMPARISON for plain text passwords)
    // const isValidPassword = await bcrypt.compare(teacherPassword, classroom.teacherPassword); <--- УБРАЛИ
    
    // Сравниваем просто как строки
    const isValidPassword = teacherPassword === classroom.teacherPassword;

    if (!isValidPassword) {
      return {
        error: 'Invalid login or password',
      };
    }

    // Create session with classId as userId and role as TEACHER
    await createSession(
      classroom.id, // Use classId as userId for teacher sessions
      'TEACHER',
      classroom.schoolId,
      classroom.id
    );

    // Redirect to teacher dashboard
    redirect('/teacher-dashboard');
  } catch (error: any) {
    // Handle redirect errors (they throw NEXT_REDIRECT)
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('Teacher login error:', error);
    return {
      error: 'An error occurred during login. Please try again.',
    };
  }
}

/**
 * Teacher logout action
 */
export async function teacherLogoutAction() {
  await deleteSession();
  redirect('/login');
}