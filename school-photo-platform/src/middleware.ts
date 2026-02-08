import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

type ExtendedRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. ЛОГИКА ДЛЯ СТРАНИЦЫ ВХОДА (Если уже вошел - кидаем в дашборд)
  if (pathname.startsWith('/login')) {
    if (session) {
      const payload = await decrypt(session);
      if (payload?.role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
      if (payload?.role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (payload?.role === 'TEACHER') return NextResponse.redirect(new URL('/teacher-dashboard', request.url)); // Проверь правильность пути!
    }
    return NextResponse.next();
  }

  // 2. ЗАЩИТА ПРИВАТНЫХ МАРШРУТОВ (Если нет сессии - кидаем на вход)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admins') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher');

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если маршрут не защищенный (например публичная галерея /s/...), пропускаем
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 3. ПРОВЕРКА РОЛЕЙ (Если сессия есть, проверяем права)
  const payload = await decrypt(session!);
  if (!payload) return NextResponse.redirect(new URL('/login', request.url));

  const role = payload.role as ExtendedRole;

  // SUPER ADMIN
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admins')) && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url)); // Или на 404
  }

  // ADMIN (Может заходить в /admin, но SUPER_ADMIN тоже может)
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // TEACHER (SUPER_ADMIN can also access for debugging)
  if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admins/:path*',
    '/admin/:path*',
    '/teacher/:path*', // Убедись что папка называется teacher или teacher-dashboard
    '/login',
  ],
};