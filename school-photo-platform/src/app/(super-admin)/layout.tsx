import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, deleteSession } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Crown,
  Building2,
  Camera,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

async function SuperAdminLayout({ children }: { children: React. ReactNode }) {
  const session = await getSession();

  // Protect the route
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  async function handleLogout() {
    'use server';
    await deleteSession();
    redirect('/login');
  }

  const platformNavItems = [
    {
      name: 'Панель управления платформой',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Управление фотографами',
      href: '/admins',
      icon: Users,
    },
  ];

  const photographyNavItems = [
    {
      name: 'Мои школы',
      href: '/admin/schools',
      icon: Building2,
    },
    {
      name: 'Панель управления фото',
      href: '/admin/dashboard',
      icon: Camera,
    },
    {
      name: 'Запросы на изменения',
      href: '/admin/requests',
      icon: FileText,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg">
              <Crown className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Супер Админ</h1>
              <p className="text-xs text-slate-400">Режим Бога</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Platform Admin Section */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Администрирование платформы
              </h2>
            </div>
            <div className="space-y-1">
              {platformNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-yellow-400" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* My Photography Business Section */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Мой фото-бизнес
              </h2>
            </div>
            <div className="space-y-1">
              {photographyNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="mx-2 p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Быстрый доступ</h3>
            <p className="text-xs text-blue-100 mb-3">
              Мгновенно переключайтесь между режимами администратора
            </p>
            <Link href="/admin/schools/new">
              <Button
                size="sm"
                className="w-full bg-white text-blue-600 hover:bg-blue-50"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Создать школу
              </Button>
            </Link>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 font-bold">
                    SA
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Супер Админ</p>
                  <p className="text-xs text-slate-400">Полный доступ</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="cursor-pointer">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Перейти в режим фотографа
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={handleLogout}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full flex items-center gap-2 text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    <span>Выйти</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default SuperAdminLayout;