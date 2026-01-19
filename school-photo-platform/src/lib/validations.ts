import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Пожалуйста, введите корректный адрес электронной почты'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
});

export const teacherLoginSchema = z.object({
  teacherLogin: z.string().min(3, 'Логин обязателен'),
  teacherPassword: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
});

export const schoolSchema = z.object({
  name: z.string().min(3, 'Название школы должно содержать не менее 3 символов'),
  slug: z
    .string()
    .min(3, 'Слаг должен содержать не менее 3 символов')
    .regex(/^[a-z0-9-]+$/, 'Слаг должен содержать только строчные буквы, цифры и дефисы'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Должен быть корректный HEX цвет'),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export const classroomSchema = z.object({
  name: z.string().min(2, 'Название класса должно содержать не менее 2 символов'),
});

export const checkoutSchema = z.object({
  name: z.string().min(3, 'Введите полные фамилию и имя ученика'),
  email: z.string().email('Пожалуйста, введите корректный адрес электронной почты').optional().or(z.literal('')),
  // Это позволит полю быть пустым и не ругаться на формат
  phone: z.string().optional().or(z.literal('')), 
});
export const editRequestSchema = z.object({
  reason: z.string().min(10, 'Пожалуйста, укажите не менее 10 символов, объясняющих проблему'),
});

export const photographerSchema = z.object({
  email: z.string().email('Пожалуйста, введите корректный адрес электронной почты'),
  password: z.string().min(8, 'Пароль должен содержать не менее 8 символов'),
  firstName: z.string().min(2, 'Имя обязательно'),
  lastName: z.string().min(2, 'Фамилия обязательна'),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TeacherLoginInput = z.infer<typeof teacherLoginSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type ClassroomInput = z.infer<typeof classroomSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type EditRequestInput = z.infer<typeof editRequestSchema>;
export type PhotographerInput = z.infer<typeof photographerSchema>;