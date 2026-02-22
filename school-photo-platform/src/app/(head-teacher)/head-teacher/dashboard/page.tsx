import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DownloadSchoolOrdersButton from '@/components/admin/DownloadSchoolOrdersButton';
import { headTeacherLogoutAction } from '@/actions/head-teacher/auth-actions';
import { LogOut, LayoutDashboard, Building2 } from 'lucide-react';

export default async function HeadTeacherDashboard() {
    const session = await getSession();

    if (!session || session.role !== 'HEAD_TEACHER') {
        redirect('/login');
    }

    // The userId for HEAD_TEACHER is the schoolId
    const schoolId = session.userId;

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
            classrooms: {
                include: {
                    orders: true,
                }
            }
        }
    });

    if (!school) {
        redirect('/login');
    }

    const totalOrders = school.classrooms.reduce(
        (acc, classroom) => acc + classroom.orders.length,
        0
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h1 className="font-semibold text-slate-900 truncate">
                            Панель завуча: {school.name}
                        </h1>
                    </div>
                    <form action={headTeacherLogoutAction}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Выйти</span>
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Отчеты по заказам</h2>
                    <p className="text-slate-600 mb-8 max-w-2xl">
                        Вы можете скачать сводный отчет в формате Excel по всем классам и заказам вашей школы.
                    </p>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-medium text-slate-900">Общий список заказов</h3>
                                <p className="text-sm text-slate-500 mt-1">Всего заказов: {totalOrders}</p>
                            </div>
                            <DownloadSchoolOrdersButton
                                schoolId={school.id}
                                totalOrders={totalOrders}
                                hideZip={true}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
