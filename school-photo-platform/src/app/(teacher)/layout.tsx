import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTeacherDashboardData } from '@/actions/teacher/dashboard-actions';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Защита маршрута - разрешена только роль TEACHER
  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  // Получение данных о классе для навбара
  let classroomName = 'Портал учителя';
  let schoolName = '';

  try {
    const data = await getTeacherDashboardData();
    classroomName = data.classroom.name;
    schoolName = data.school.name;
  } catch (error) {
    console.error('Ошибка загрузки данных о классе для layout:', error);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherNavbar classroomName={classroomName} schoolName={schoolName} />
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}