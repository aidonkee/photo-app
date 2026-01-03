import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/shared/Sidebar';

type SuperAdminLayoutProps = {
  children: React.ReactNode;
};

export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="SUPER_ADMIN" />
      <main className="flex-1 bg-slate-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}