import React from 'react';
import { getPlatformStats } from '@/actions/super-admin/platform-actions';
import AdminStatsCard from '@/components/super-admin/AdminStatsCard';
import { DollarSign, Users, Building2, ShoppingCart } from 'lucide-react';

export default async function PlatformMetrics() {
  const stats = await getPlatformStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatsCard
        title="Общая выручка"
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        description="С всех завершённых заказов"
        color="text-slate-900"
        bgColor="bg-slate-50"
        iconBgColor="bg-green-100"
      />
      <AdminStatsCard
        title="Фотографы"
        value={stats.totalAdmins}
        icon={Users}
        description="Активные аккаунты администраторов"
        color="text-slate-900"
        bgColor="bg-slate-50"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Школы"
        value={stats.totalSchools}
        icon={Building2}
        description="Зарегистрированные школы"
        color="text-slate-900"
        bgColor="bg-slate-50"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Всего заказов"
        value={stats.totalOrders}
        icon={ShoppingCart}
        description="Заказы за всё время"
        color="text-orange-600"
        bgColor="bg-orange-50"
        iconBgColor="bg-orange-100"
      />
    </div>
  );
}