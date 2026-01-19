import React from 'react';
import { redirect } from 'next/navigation';
import { getSession, deleteSession } from '@/lib/auth';
import { getSchoolsWithClassrooms } from '@/actions/admin/sidebar-actions';
import Sidebar from '@/components/shared/Sidebar';
import MobileSidebar from '@/components/shared/MobileSidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
};

async function handleLogout() {
  'use server';
  await deleteSession();
  redirect('/login');
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login');
  }

  const schools = await getSchoolsWithClassrooms();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden lg:block">
        <Sidebar role="ADMIN" schools={schools} onLogout={handleLogout} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar role="ADMIN" schools={schools} onLogout={handleLogout} />

      {/* Main Content - with left margin to prevent overlap */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}