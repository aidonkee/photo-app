import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, verifySchoolAccess } from '@/lib/auth';

type ExtendedRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session_token')?.value;

  // ---- SAFE decrypt (не валимся от битой cookie) ----
  let payload: any = null;
  let shouldDeleteSession = false;
  if (session) {
    try {
      payload = await decrypt(session);
    } catch {
      // cookie битая/устарела => помечаем на удаление, продолжаем как гость
      payload = null;
      shouldDeleteSession = true;
    }
  }

  // Хелпер: прицепляет удаление битой cookie к любому ответу
  function finalize(response: NextResponse): NextResponse {
    if (shouldDeleteSession) {
      response.cookies.delete('session_token');
    }
    return response;
  }

  // 1) /login: если уже вошел - кидаем в нужный дашборд
  if (pathname.startsWith('/login')) {
    if (payload?.role === 'SUPER_ADMIN') return finalize(NextResponse.redirect(new URL('/dashboard', request.url)));
    if (payload?.role === 'ADMIN') return finalize(NextResponse.redirect(new URL('/admin/dashboard', request.url)));
    if (payload?.role === 'TEACHER') return finalize(NextResponse.redirect(new URL('/teacher-dashboard', request.url)));
    return finalize(NextResponse.next());
  }

  // 2) Публичные страницы школ (/s/...)
  if (pathname.startsWith('/s/')) {
    const parts = pathname.split('/');
    const schoolSlug = parts[2]; // /s/[schoolSlug]

    if (schoolSlug) {
      const token = request.nextUrl.searchParams.get('t');
      const accessCookie = request.cookies.get(`sc_${schoolSlug}`)?.value;

      // Если есть токен — валидируем и ставим куку доступа
      if (token) {
        const isValid = await verifySchoolAccess(schoolSlug, token);
        if (isValid) {
          const response = NextResponse.next();
          response.cookies.set(`sc_${schoolSlug}`, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          });
          return finalize(response);
        }
      }

      // Если токена нет/невалидный — проверяем куку доступа
      if (!accessCookie) {
        return finalize(NextResponse.redirect(new URL('/', request.url)));
      }
    }

    // /s/... не требует админской сессии — пропускаем дальше
    return finalize(NextResponse.next());
  }

  // 3) Приватные роуты (админка/учитель/суперадмин)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admins') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher');

  if (isProtectedRoute && !payload) {
    return finalize(NextResponse.redirect(new URL('/login', request.url)));
  }

  // Если это не protected — пропускаем
  if (!isProtectedRoute) {
    return finalize(NextResponse.next());
  }

  // 4) Проверка ролей
  const role = payload.role as ExtendedRole;

  // SUPER_ADMIN
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admins')) && role !== 'SUPER_ADMIN') {
    return finalize(NextResponse.redirect(new URL('/unauthorized', request.url)));
  }

  // ADMIN (и SUPER_ADMIN тоже)
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return finalize(NextResponse.redirect(new URL('/unauthorized', request.url)));
  }

  // TEACHER (и SUPER_ADMIN тоже)
  if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'SUPER_ADMIN') {
    return finalize(NextResponse.redirect(new URL('/unauthorized', request.url)));
  }

  return finalize(NextResponse.next());
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admins/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/login',
    '/s/:path*',
  ],
};

