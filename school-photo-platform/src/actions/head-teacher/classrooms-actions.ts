'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Ensures the invoker is an authenticated Head Teacher.
 * Returns the schoolId.
 */
async function requireHeadTeacherAuth() {
    const session = await getSession();
    if (!session || session.role !== 'HEAD_TEACHER' || !session.schoolId) {
        throw new Error('Unauthorized');
    }
    return session.schoolId;
}

/**
 * Get all classrooms for the head teacher's school along with order statistics.
 */
export async function getSchoolClassrooms() {
    const schoolId = await requireHeadTeacherAuth();

    const classrooms = await prisma.classroom.findMany({
        where: { schoolId },
        include: {
            _count: {
                select: {
                    orders: true,
                    photos: true,
                }
            }
        },
        orderBy: { name: 'asc' },
    });

    return classrooms;
}

/**
 * Generate a new random password for a classroom.
 */
export async function generateTeacherCredentials(classroomId: string) {
    const schoolId = await requireHeadTeacherAuth();

    // Verify classroom belongs to the head teacher's school
    const classroom = await prisma.classroom.findFirst({
        where: { id: classroomId, schoolId },
    });

    if (!classroom) {
        throw new Error('Classroom not found or access denied');
    }

    // Generate a simple 6-digit password or random string
    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.classroom.update({
        where: { id: classroomId },
        data: { teacherPassword: newPassword },
    });

    revalidatePath('/head-teacher/classrooms');
    return { success: true, password: newPassword };
}

/**
 * Manually update a teacher's login and/or password.
 */
export async function updateTeacherCredentials(classroomId: string, login: string, password?: string) {
    const schoolId = await requireHeadTeacherAuth();

    const classroom = await prisma.classroom.findFirst({
        where: { id: classroomId, schoolId },
    });

    if (!classroom) {
        throw new Error('Classroom not found or access denied');
    }

    // Ensure login is unique across all classrooms if it changed
    if (login !== classroom.teacherLogin) {
        const existing = await prisma.classroom.findUnique({
            where: { teacherLogin: login }
        });
        if (existing) {
            throw new Error('Этот логин уже занят');
        }
    }

    const data: any = { teacherLogin: login };
    if (password) {
        data.teacherPassword = password;
    }

    await prisma.classroom.update({
        where: { id: classroomId },
        data,
    });

    revalidatePath('/head-teacher/classrooms');
    return { success: true };
}

/**
 * Lock or unlock a classroom to allow/prevent new orders.
 */
export async function toggleClassroomLock(classroomId: string, isLocked: boolean) {
    const schoolId = await requireHeadTeacherAuth();

    const classroom = await prisma.classroom.findFirst({
        where: { id: classroomId, schoolId },
    });

    if (!classroom) {
        throw new Error('Classroom not found or access denied');
    }

    await prisma.classroom.update({
        where: { id: classroomId },
        data: {
            isLocked,
            lockedAt: isLocked ? new Date() : null,
        },
    });

    revalidatePath('/head-teacher/classrooms');
    return { success: true };
}
