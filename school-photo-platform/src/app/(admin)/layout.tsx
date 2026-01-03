import React from 'react';
import { redirect } from 'next/navigation';
import { getSession, deleteSession } from '@/lib/auth';
import { getSchoolsWithClassrooms } from '@/actions/admin/sidebar-actions';
import Sidebar from '@/components/shared/Sidebar';
import MobileSidebar from '@/components/shared/MobileSidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
};

// Серверный экшен для выхода из системы
async function handleLogout() {
  'use server';
  await deleteSession();
  redirect('/login');
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1. Проверка авторизации
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  // 2. Получение данных для сайдбара (Школы -> Классы)
  const schools = await getSchoolsWithClassrooms();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Десктопный Сайдбар (скрыт на мобильных) */}
      <div className="hidden lg:block w-64 fixed inset-y-0 z-50">
        <Sidebar 
          role={session.role as 'ADMIN' | 'SUPER_ADMIN'} 
          schools={schools} 
          onLogout={handleLogout} 
        />
      </div>

      {/* Мобильный Сайдбар (гамбургер-меню) */}
      <MobileSidebar 
        role={session.role as 'ADMIN' | 'SUPER_ADMIN'} 
        schools={schools} 
        onLogout={handleLogout} 
      />

      {/* Основной контент */}
      {/* lg:pl-64 сдвигает контент вправо на ширину сайдбара на десктопе */}
      <main className="flex-1 lg:pl-64 transition-all duration-300">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}