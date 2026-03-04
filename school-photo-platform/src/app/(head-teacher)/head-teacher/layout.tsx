import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headTeacherLogoutAction } from '@/actions/head-teacher/auth-actions';
import { LogOut, LayoutDashboard, Building2, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { NavLink } from './NavLink';

export default async function HeadTeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.role !== 'HEAD_TEACHER') {
        redirect('/login');
    }

    const schoolId = session.userId;

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { name: true }
    });

    if (!school) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                    <h1 className="font-semibold text-slate-900 truncate" title={school.name}>
                        {school.name}
                    </h1>
                </div>

                <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                    <NavLink href="/head-teacher/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                        Главная
                    </NavLink>
                    <NavLink href="/head-teacher/classrooms" icon={<Users className="w-4 h-4" />}>
                        Классы
                    </NavLink>
                    <NavLink href="/head-teacher/orders" icon={<ShoppingBag className="w-4 h-4" />}>
                        Заказы
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-200 hidden md:block">
                    <form action={headTeacherLogoutAction}>
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Выйти
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 md:h-screen md:overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
