import React from 'react';
import Link from 'next/link';
import { getSchoolStats } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Image, 
  ShoppingCart, 
  Plus,
  ArrowRight,
  Camera,
  Users
} from 'lucide-react';

export const metadata = {
  title: 'Панель фотографа',
  description: 'Управляйте вашими школами и фотографиями',
};

export default async function AdminDashboardPage() {
  const stats = await getSchoolStats();

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
          <Camera className="w-8 h-8 text-slate-900" />
          Панель фотографа
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Обзор статистики и управление проектами
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Всего школ" 
          value={stats. totalSchools} 
          subtitle="Активные аккаунты"
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatCard 
          title="Всего классов" 
          value={stats.totalClassrooms} 
          subtitle="Во всех школах"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard 
          title="Всего фотографий" 
          value={stats.totalPhotos} 
          subtitle="Загружено в базу"
          icon={<Image className="w-5 h-5" />}
        />
        <StatCard 
          title="Всего заказов" 
          value={stats.totalOrders} 
          subtitle="За всё время"
          icon={<ShoppingCart className="w-5 h-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <ActionCard 
            href="/admin/schools"
            icon={<Building2 className="w-6 h-6" />}
            title="Просмотр школ"
            description="Управление списком школ и классов"
            linkText="Перейти к списку"
          />

          {/* 🆕 ЗАКАЗЫ В БЫСТРЫХ ДЕЙСТВИЯХ */}
          <ActionCard 
            href="/admin/schools"
            icon={<ShoppingCart className="w-6 h-6" />}
            title="Заказы"
            description="Просмотр и управление заказами родителей"
            linkText="Посмотреть заказы"
          />

          <ActionCard 
            href="/admin/requests"
            icon={<Users className="w-6 h-6" />}
            title="Запросы доступа"
            description="Проверка заявок от учителей"
            linkText="Проверить"
          />
          
        </div>
      </div>
    </div>
  );
}

// Вспомогательные компоненты
function StatCard({ title, value, subtitle, icon }: { title: string, value: number, subtitle: string, icon: React.ReactNode }) {
  return (
    <Card className="bg-white border border-slate-200 shadow-none rounded-lg hover:border-slate-400 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="text-slate-900">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-light text-slate-900">
          {value}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

function ActionCard({ href, icon, title, description, linkText }: { href: string, icon: React.ReactNode, title: string, description: string, linkText: string }) {
  return (
    <Link href={href} className="group block h-full">
      <div className="h-full p-6 bg-white border border-slate-200 rounded-lg transition-all duration-300 hover:border-slate-900 hover:shadow-sm flex flex-col justify-between">
        <div>
          <div className="mb-4 text-slate-900 p-3 bg-slate-50 w-fit rounded-md group-hover:bg-slate-900 group-hover:text-white transition-colors">
            {icon}
          </div>
          <h3 className="font-medium text-lg text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {description}
          </p>
        </div>
        <div className="flex items-center text-sm font-medium text-slate-900 group-hover:underline underline-offset-4">
          {linkText}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}