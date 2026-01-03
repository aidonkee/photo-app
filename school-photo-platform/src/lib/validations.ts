import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const teacherLoginSchema = z.object({
  teacherLogin: z.string().min(3, 'Login is required'),
  teacherPassword:  z.string().min(6, 'Password must be at least 6 characters'),
});

export const schoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export const classroomSchema = z.object({
  name: z.string().min(2, 'Classroom name must be at least 2 characters'),
});

export const checkoutSchema = z.object({
  name: z.string().min(2, 'First name is required'),
  surname: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
});

export const editRequestSchema = z.object({
  reason: z.string().min(10, 'Please provide at least 10 characters explaining the issue'),
});

export const photographerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TeacherLoginInput = z.infer<typeof teacherLoginSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type ClassroomInput = z. infer<typeof classroomSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type EditRequestInput = z.infer<typeof editRequestSchema>;
export type PhotographerInput = z.infer<typeof photographerSchema>;