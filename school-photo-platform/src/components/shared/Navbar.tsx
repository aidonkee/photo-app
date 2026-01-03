'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type NavbarProps = {
  session?: {
    userId:  string;
    role: string;
  } | null;
};

export default function Navbar({ session }: NavbarProps) {
  const navItems = session
    ?  session.role === 'SUPER_ADMIN'
      ? siteConfig.nav.superAdmin
      : session.role === 'ADMIN'
      ? siteConfig.nav.admin
      : session.role === 'TEACHER'
      ? siteConfig.nav.teacher
      : siteConfig.nav.main
    : siteConfig.nav.main;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-white font-bold text-xl">SP</span>
            </div>
            <span className="hidden sm:block font-bold text-xl text-slate-900">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-700 hover:text-slate-900 font-medium transition-colors"
              >
                {item.title}
              </Link>
            ))}
            {! session && (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-lg font-medium text-slate-900 hover:text-slate-900"
                  >
                    {item.title}
                  </Link>
                ))}
                {!session && (
                  <Link href="/login">
                    <Button className="w-full">Login</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}