import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import { getTeacherDashboardData } from '@/actions/teacher/dashboard-actions';

type TeacherLayoutProps = {
  children: React.ReactNode;
};

export default async function TeacherLayout({ children }: TeacherLayoutProps) {
  const session = await getSession();

  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  let classroomName = 'Teacher Portal';
  let schoolName = '';

  try {
    const data = await getTeacherDashboardData();
    classroomName = data.classroom. name;
    schoolName = data.school.name;
  } catch (error) {
    console.error('Error loading classroom data:', error);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherNavbar classroomName={classroomName} schoolName={schoolName} />
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}