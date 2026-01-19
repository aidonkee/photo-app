'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { teacherLogoutAction } from '@/actions/teacher/auth-actions';
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
import {
  LayoutList, // Иконка списка лучше подходит для проверки
  Image,
  LogOut,
  Menu,
  CheckSquare
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle, 
  SheetHeader 
} from '@/components/ui/sheet';

type TeacherNavbarProps = {
  className?: string;
  classroomName?: string;
  schoolName?: string;
};

export default function TeacherNavbar({
  className,
  classroomName,
  schoolName,
}: TeacherNavbarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const navItems = [
    {
      name: 'Проверка заказов',
      href: '/teacher-dashboard',
      icon: CheckSquare,
    },
    {
      name: 'Фотографии класса',
      href: '/classroom',
      icon: Image,
    },
    // Убрал лишнюю ссылку "Orders", так как "Dashboard" и есть заказы
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await teacherLogoutAction();
    });
  };

  const isActive = (href: string) => {
    if (href === '/teacher-dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className={`bg-white border-b border-slate-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Лого и инфо о классе */}
          <div className="flex items-center gap-3">
             {/* Скрываем лого на очень маленьких экранах, оставляем текст */}
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {classroomName || 'Кабинет учителя'}
              </h1>
              {schoolName && (
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{schoolName}</p>
              )}
            </div>
          </div>

          {/* Десктоп Меню */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={`gap-2 text-sm ${isActive(item.href) ? 'bg-slate-100 font-medium' : 'text-slate-600'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Профиль и Мобильное меню */}
          <div className="flex items-center gap-2">
            
            {/* Десктоп Дропдаун */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-900 text-white text-xs">
                      УЧ
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:block">Учитель</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isPending}
                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Мобильное Меню (Бургер) */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Меню</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-2 mt-6">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3 h-12 text-base"
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                  <div className="h-px bg-slate-100 my-2" />
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 h-12"
                  >
                    <LogOut className="w-5 h-5" />
                    Выйти из системы
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}