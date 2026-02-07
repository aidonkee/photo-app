'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function transliterate(word: string) {
  const a: Record<string, string> = {
    "Ё": "YO", "Й": "I", "Ц": "TS", "У": "U", "К": "K", "Е": "E", "Н": "N", "Г": "G", "Ш": "SH", "Щ": "SCH", "З": "Z", "Х": "H", "Ъ": "", "ё": "yo", "й": "i", "ц": "ts", "у": "u", "к": "k", "е": "e", "н": "n", "г": "g", "ш": "sh", "щ": "sch", "з": "z", "х": "h", "ъ": "", "Ф": "F", "Ы": "I", "В": "V", "А": "A", "П": "P", "Р": "R", "О": "O", "Л": "L", "Д": "D", "Ж": "ZH", "Э": "E", "ф": "f", "ы": "i", "в": "v", "а": "a", "п": "p", "р": "r", "о": "o", "л": "l", "д": "d", "ж": "zh", "э": "e", "Я": "Ya", "Ч": "CH", "С": "S", "М": "M", "И": "I", "Т": "T", "Ь": "", "Б": "B", "Ю": "YU", "я": "ya", "ч": "ch", "с": "s", "м": "m", "и": "i", "т": "t", "ь": "", "б": "b", "ю": "yu"
  };
  return word.split('').map((char) => a[char] || char).join("");
}

async function generateTeacherLogin(schoolSlug: string, className: string): Promise<string> {
  const latinName = transliterate(className);
  const cleanName = latinName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);

  const baseLogin = `${schoolSlug}_${cleanName}`;
  let login = baseLogin;
  let counter = 1;

  while (true) {
    const existing = await prisma.classroom.findUnique({
      where: { teacherLogin: login },
    });

    if (!existing) {
      return login;
    }
    counter++;
    login = `${baseLogin}_${counter}`;
  }
}

function generatePassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- ОСНОВНЫЕ ЭКШЕНЫ ---

export async function getClassrooms(schoolId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) redirect('/admin/dashboard');
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      redirect('/admin/dashboard');
    }

    const classrooms = await prisma.classroom.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: {
            photos: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return classrooms;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw new Error('Failed to fetch classrooms');
  }
}

export async function getClassroomById(classId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: {
        school: true,
        photos: true,
        _count: {
          select: {
            photos: true,
            orders: true,
          },
        },
      },
    });

    if (!classroom) {
      redirect('/admin/dashboard');
    }
    if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
      redirect('/admin/dashboard');
    }

    return classroom;
  } catch (error) {
    console.error('Error fetching classroom:', error);
    throw new Error('Failed to fetch classroom details');
  }
}

export async function createClassroomAction(
  schoolId: string,
  prevState: any,
  formData: FormData
) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { error: 'Unauthorized access' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim().length === 0) {
    return { error: 'Classroom name is required' };
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) return { error: 'School not found' };
    if (session.role === 'ADMIN' && school.adminId !== session.userId) {
      return { error: 'Access denied' };
    }

    const plainPassword = generatePassword();
    const teacherLogin = await generateTeacherLogin(school.slug, name);

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        schoolId,
        teacherLogin,
        teacherPassword: plainPassword,
        isEditAllowed: false,
        isLocked: false,
      },
    });

    revalidatePath(`/admin/schools/${schoolId}`);

    return {
      success: true,
      classroomId: classroom.id,
      teacherLogin,
      plainPassword,
      message: 'Classroom created successfully',
    };
  } catch (error) {
    console.error('Error creating classroom:', error);
    return { error: 'Failed to create classroom. Please try again.' };
  }
}

export async function deleteClassroomAction(classId: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized access');
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: {
        school: true,
        _count: {
          select: {
            photos: true,
            orders: true,
          },
        },
      },
    });

    if (!classroom) throw new Error('Classroom not found');
    if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
      throw new Error('Access denied');
    }

    // ✅ Cascade delete allowed
    await prisma.classroom.delete({
      where: { id: classId },
    });

    revalidatePath(`/admin/schools/${classroom.schoolId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting classroom:', error);
    throw new Error(error.message || 'Failed to delete classroom');
  }
}

/**
 * 🆕 Find or create a classroom by name within a school
 * Used by SchoolFolderUploader for automatic class creation during bulk upload
 */
export async function findOrCreateClassroom(schoolId: string, className: string) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  // Validate school ownership
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { adminId: true, slug: true },
  });

  if (!school) {
    throw new Error('School not found');
  }

  if (session.role === 'ADMIN' && school.adminId !== session.userId) {
    throw new Error('Access denied');
  }

  // Normalize class name
  const normalizedName = className.trim();

  if (!normalizedName) {
    throw new Error('Class name cannot be empty');
  }

  // Try to find existing classroom (case-insensitive)
  let classroom = await prisma.classroom.findFirst({
    where: {
      schoolId,
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });

  // Create if not exists
  if (!classroom) {
    const plainPassword = generatePassword();
    const teacherLogin = await generateTeacherLogin(school.slug, normalizedName);

    classroom = await prisma.classroom.create({
      data: {
        name: normalizedName,
        schoolId,
        teacherLogin,
        teacherPassword: plainPassword,
        isEditAllowed: false,
        isLocked: false,
      },
    });

    return {
      id: classroom.id,
      name: classroom.name,
      isNew: true,
    };
  }

  return {
    id: classroom.id,
    name: classroom.name,
    isNew: false,
  };
}