import React from 'react';
import { getPlatformStats } from '@/actions/super-admin/platform-actions';
import AdminStatsCard from './AdminStatsCard';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatsCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        description="From all completed orders"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Photographers"
        value={stats.totalAdmins}
        icon={Users}
        description="Active admin accounts"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Schools"
        value={stats.totalSchools}
        icon={Building2}
        description="Registered schools"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
      <AdminStatsCard
        title="Total Orders"
        value={stats.totalOrders}
        icon={ShoppingCart}
        description="All time orders"
        color="text-slate-900"
        bgColor="bg-white"
        iconBgColor="bg-slate-100"
      />
    </div>
  );
}