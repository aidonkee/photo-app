'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  Building2, 
  ShoppingCart,
  TrendingUp,
  Plus,
  Camera,
  ArrowRight,
  Sparkles
} from 'lucide-react';

type PlatformStats = {
  totalSchools:  number;
  totalAdmins: number;
  totalOrders: number;
  totalRevenue: number;
};

type GodModeDashboardProps = {
  stats: PlatformStats;
};

export default function GodModeDashboard({ stats }: GodModeDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
    }).format(amount);
  };

  const statsCards = [
    {
      title: 'Общий доход',
      value: formatCurrency(stats.totalRevenue),
      description: 'С завершенных заказов',
      icon: DollarSign,
      color: 'text-slate-900',
      bgColor: 'bg-slate-50',
      iconBgColor: 'bg-slate-100',
    },
    {
      title: 'Фотографы',
      value: stats.totalAdmins.toString(),
      description: 'Активные аккаунты администраторов',
      icon: Users,
      color: 'text-slate-900',
      bgColor:  'bg-slate-50',
      iconBgColor: 'bg-slate-100',
    },
    {
      title: 'Школы',
      value: stats.totalSchools.toString(),
      description: 'Зарегистрированные школы',
      icon: Building2,
      color: 'text-slate-900',
      bgColor: 'bg-slate-50',
      iconBgColor: 'bg-slate-100',
    },
    {
      title: 'Всего заказов',
      value: stats.totalOrders.toString(),
      description: 'За все время',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Обзор платформы
            <TrendingUp className="w-8 h-8 text-slate-900" />
          </h1>
          <p className="text-slate-600 mt-2">
            Следите за производительностью и метриками всей платформы
          </p>
        </div>
        
        {/* Quick Mode Switch */}
        <Link href="/admin/dashboard">
          <Button variant="outline" className="gap-2 border-slate-300 text-slate-900 hover:bg-slate-50">
            <Camera className="w-4 h-4" />
            Переключиться в режим фотографа
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-shadow duration-300`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                {stat.title}
              </CardTitle>
              <div className={`p-2 ${stat.iconBgColor} rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Section */}
      <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-900" />
            <CardTitle className="text-xl text-slate-900">Быстрые действия</CardTitle>
          </div>
          <p className="text-sm text-slate-800">
            Управляйте своим бизнесом фотографии вместе с администрированием платформы
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            {/* Create New School */}
            <Link href="/admin/schools/new" className="block">
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-slate-400 cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Plus className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Создать новую школу</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Добавьте новую школу в свое портфолио
                </p>
                <div className="mt-4 flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all">
                  Начать
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Go to Photographer Workspace */}
            <Link href="/admin/dashboard" className="block">
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover: border-indigo-400 cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Camera className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Рабочая область фотографа</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Управляйте школами, фотографиями и заказами
                </p>
                <div className="mt-4 flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all">
                  Открыть панель
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* View My Schools */}
            <Link href="/admin/schools" className="block">
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-400 cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Building2 className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Мои школы</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Просматривайте и управляйте всеми зарегистрированными школами
                </p>
                <div className="mt-4 flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all">
                  Просмотреть все
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Platform Insights */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Аналитика платформы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Средний доход на школу</p>
              <p className="text-sm text-slate-600">На основе завершенных заказов</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalSchools > 0
                ? formatCurrency(stats.totalRevenue / stats.totalSchools)
                : '₸0.00'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Школ на фотографа</p>
              <p className="text-sm text-slate-600">Среднее распределение</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalAdmins > 0
                ? (stats.totalSchools / stats.totalAdmins).toFixed(1)
                : '0.0'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Средняя стоимость заказа</p>
              <p className="text-sm text-slate-600">За завершенную транзакцию</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalOrders > 0
                ? formatCurrency(stats.totalRevenue / stats.totalOrders)
                : '₸0.00'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}