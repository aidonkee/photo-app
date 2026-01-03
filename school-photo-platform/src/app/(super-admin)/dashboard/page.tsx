import React from 'react';
import { getPlatformStats } from '@/actions/super-admin/platform-actions';
import GodModeDashboard from '@/components/super-admin/GodModeDashboard';

export const metadata = {
  title: 'Панель управления Супер Админа',
  description: 'Обзор платформы и статистика',
};

export default async function SuperAdminDashboardPage() {
  const stats = await getPlatformStats();

  return <GodModeDashboard stats={stats} />;
}