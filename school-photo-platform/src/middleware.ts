import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, verifySchoolAccess } from '@/lib/auth';

type ExtendedRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session_token')?.value;

  // ---- 1) /s/ маршруты (публичные): отдельная логика, админскую сессию не трогаем вообще ----
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
          return response;
        }
      }

      // Если токена нет/невалидный — проверяем куку доступа
      if (!accessCookie) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // ---- 2) Работа с сессией для остальных маршрутов ----
  let payload: any = null;
  let shouldDeleteSession = false;

  if (sessionToken) {
    try {
      // Вызываем decrypt только если sessionToken — не пустая строка
      payload = sessionToken ? await decrypt(sessionToken) : null;

      // Если токен был, но расшифровать не удалось (вернул null) — помечаем на удаление
      if (sessionToken && !payload) {
        shouldDeleteSession = true;
      }
    } catch (error) {
      // На случай критических ошибок decrypt (хотя внутри него обычно try-catch)
      console.error('Middleware decrypt error:', error);
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

  // 3) Приватные роуты (админка/учитель/суперадмин)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admins') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher');

  if (isProtectedRoute && !payload) {
    // Если сессия битая или отсутствует на защищенном роуте — редирект на логин + удаление куки
    return finalize(NextResponse.redirect(new URL('/login', request.url)));
  }

  // Если это не protected — пропускаем
  if (!isProtectedRoute) {
    return finalize(NextResponse.next());
  }

  // 4) Проверка ролей (payload гарантированно есть)
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

