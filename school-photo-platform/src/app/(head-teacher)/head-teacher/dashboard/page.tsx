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
        (acc: number, classroom: any) => acc + classroom.orders.length,
        0
    );

    return (
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-900">Классы и классные руководители</h3>
                    <p className="text-sm text-slate-500 mt-1">Информация для координации с учителями</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Класс</th>
                                <th className="px-6 py-4">Заказы</th>
                                <th className="px-6 py-4">Логин учителя</th>
                                <th className="px-6 py-4">Пароль учителя</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {school.classrooms.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Нет добавленных классов
                                    </td>
                                </tr>
                            ) : (
                                school.classrooms.map((cls: any) => (
                                    <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{cls.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {cls.orders.length} шт.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{cls.teacherLogin}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{cls.teacherPassword}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
