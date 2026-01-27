import { getPlatformStats } from '@/actions/super-admin/platform-actions';
import GodModeDashboard from '@/components/super-admin/GodModeDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Панель управления Супер Админа',
  description: 'Обзор платформы и статистика',
};

export default async function SuperAdminDashboardPage() {
  const stats = await getPlatformStats();

  return <GodModeDashboard stats={stats} />;
}
