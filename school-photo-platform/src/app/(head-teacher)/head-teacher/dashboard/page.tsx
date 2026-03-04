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
    );
}
