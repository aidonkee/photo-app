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
  LayoutDashboard,
  Image,
  ShoppingCart,
  LogOut,
  GraduationCap,
  Menu,
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
      name: 'Dashboard',
      href: '/teacher-dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Photos',
      href: '/classroom',
      icon: Image,
    },
    {
      name: 'Orders',
      href: '/classroom/orders',
      icon: ShoppingCart,
    },
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
    <nav className={`bg-white border-b border-slate-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-900 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">
                  {classroomName || 'Teacher Portal'}
                </h1>
                {schoolName && (
                  <p className="text-xs text-slate-600">{schoolName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'default' : 'ghost'}
                  className={`gap-2 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-indigo-600 to-slate-900'
                      : ''
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                {/* --- Fix: Added SheetHeader & SheetTitle --- */}
                <SheetHeader>
                  <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                </SheetHeader>
                {/* ------------------------------------------- */}
                
                <div className="flex flex-col gap-4 mt-6">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? 'default' : 'ghost'}
                        className={`w-full justify-start gap-3 ${
                          isActive(item.href)
                            ? 'bg-gradient-to-r from-indigo-600 to-slate-900'
                            : ''
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="w-full justify-start gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" className="gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-900 text-white font-bold">
                      T
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">Teacher</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                {classroomName && (
                  <div className="px-2 py-1.5 text-sm text-slate-600">
                    {classroomName}
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isPending}
                  className="text-slate-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isPending ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}