import React from 'react';
import { getPlatformStats } from '@/actions/super-admin/platform-actions';
import AdminStatsCard from './AdminStatsCard';
import { DollarSign, Users, Building2, ShoppingCart } from 'lucide-react';

export default async function PlatformMetrics() {
  const stats = await getPlatformStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatsCard
        title="Общий доход"
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        description="С всех завершённых заказов"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Фотографы"
        value={stats.totalAdmins}
        icon={Users}
        description="Активные аккаунты администраторов"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Школы"
        value={stats.totalSchools}
        icon={Building2}
        description="Зарегистрированные школы"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Общее количество заказов"
        value={stats.totalOrders}
        icon={ShoppingCart}
        description="Все заказы за всё время"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
    </div>
  );
}