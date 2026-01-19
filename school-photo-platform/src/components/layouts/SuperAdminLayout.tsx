import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth'; // 👈 Убрали 'logout' отсюда
import Sidebar from '@/components/shared/Sidebar';
import { cookies } from 'next/headers'; // 👈 Добавили для очистки куки

type SuperAdminLayoutProps = {
  children: React.ReactNode;
};

export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const session = await getSession();

  // Проверка прав
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // Функция выхода (Server Action)
  async function handleLogout() {
    'use server';
    // Удаляем куку сессии
    (await cookies()).delete('session');
    // Редирект на вход
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        role="SUPER_ADMIN" 
        schools={[]}            // Заглушка для списка школ
        onLogout={handleLogout} // Рабочая функция выхода
      />
      <main className="flex-1 bg-slate-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}