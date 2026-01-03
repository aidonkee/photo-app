import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function ClassroomRedirectPage() {
  // 1. Получаем сессию учителя
  const session = await getSession();

  // 2. Если у учителя есть classId, перенаправляем его туда
  if (session && session.role === 'TEACHER' && session.classId) {
    redirect(`/classroom/${session.classId}`);
  }

  // 3. Если что-то не так — выкидываем на дашборд
  redirect('/teacher-dashboard');
}