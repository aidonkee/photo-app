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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      description: 'From all completed orders',
      icon: DollarSign,
      color: 'text-slate-900',
      bgColor: 'bg-slate-50',
      iconBgColor: 'bg-green-100',
    },
    {
      title: 'Photographers',
      value: stats.totalAdmins. toString(),
      description: 'Active admin accounts',
      icon: Users,
      color: 'text-slate-900',
      bgColor:  'bg-slate-50',
      iconBgColor: 'bg-slate-100',
    },
    {
      title: 'Schools',
      value: stats.totalSchools.toString(),
      description: 'Registered schools',
      icon: Building2,
      color: 'text-slate-900',
      bgColor: 'bg-slate-50',
      iconBgColor: 'bg-slate-100',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      description: 'All time orders',
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
            Platform Overview
            <TrendingUp className="w-8 h-8 text-slate-900" />
          </h1>
          <p className="text-slate-600 mt-2">
            Monitor your entire platform performance and metrics
          </p>
        </div>
        
        {/* Quick Mode Switch */}
        <Link href="/admin/dashboard">
          <Button variant="outline" className="gap-2 border-slate-300 text-slate-900 hover:bg-slate-50">
            <Camera className="w-4 h-4" />
            Switch to Photographer Mode
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
      <Card className="border-2 border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-900" />
            <CardTitle className="text-xl text-slate-900">Quick Actions</CardTitle>
          </div>
          <p className="text-sm text-slate-800">
            Manage your own photography business alongside platform administration
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            {/* Create New School */}
            <Link href="/admin/schools/new" className="block">
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-400 cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Plus className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Create New School</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Add a new school to your photography portfolio
                </p>
                <div className="mt-4 flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Go to Photographer Workspace */}
            <Link href="/admin/dashboard" className="block">
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover: border-indigo-400 cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Camera className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Photographer Workspace</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Manage your schools, photos, and orders
                </p>
                <div className="mt-4 flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all">
                  Open Dashboard
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
                  <h3 className="font-semibold text-slate-900">My Schools</h3>
                </div>
                <p className="text-sm text-slate-600">
                  View and manage all your registered schools
                </p>
                <div className="mt-4 flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all">
                  View All
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
          <CardTitle className="text-xl">Platform Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Average Revenue per School</p>
              <p className="text-sm text-slate-600">Based on completed orders</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalSchools > 0
                ? formatCurrency(stats.totalRevenue / stats.totalSchools)
                : '$0.00'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Schools per Photographer</p>
              <p className="text-sm text-slate-600">Average distribution</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats. totalAdmins > 0
                ? (stats.totalSchools / stats.totalAdmins).toFixed(1)
                : '0.0'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Average Order Value</p>
              <p className="text-sm text-slate-600">Per completed transaction</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalOrders > 0
                ? formatCurrency(stats.totalRevenue / stats.totalOrders)
                : '$0.00'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}