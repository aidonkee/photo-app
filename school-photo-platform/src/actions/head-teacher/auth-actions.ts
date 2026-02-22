'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/auth';

/**
 * Head Teacher login action
 * Authenticates against School table using headTeacherLogin and headTeacherPassword
 */
export async function loginHeadTeacherAction(prevState: any, formData: FormData) {
    const headTeacherLogin = formData.get('headTeacherLogin') as string;
    const headTeacherPassword = formData.get('headTeacherPassword') as string;

    // Validation
    if (!headTeacherLogin || !headTeacherPassword) {
        return {
            error: 'Логин и пароль обязательны',
        };
    }

    try {
        // Find school by headTeacherLogin
        const school = await prisma.school.findUnique({
            where: { headTeacherLogin },
            select: {
                id: true,
                headTeacherPassword: true,
            },
        });

        if (!school || school.headTeacherPassword !== headTeacherPassword) {
            return {
                error: 'Неверный логин или пароль',
            };
        }

        // Create session with school.id as userId and role as HEAD_TEACHER
        await createSession(
            school.id, // Use schoolId as userId for head teacher sessions
            'HEAD_TEACHER',
            school.id
        );

    } catch (error: any) {
        console.error('Ошибка входа завуча:', error);
        return {
            error: 'Произошла ошибка при входе. Пожалуйста, попробуйте еще раз.',
        };
    }

    // Redirect to head teacher dashboard
    redirect('/head-teacher/dashboard');
}

/**
 * Head Teacher logout action
 */
export async function headTeacherLogoutAction() {
    await deleteSession();
    redirect('/login');
}
