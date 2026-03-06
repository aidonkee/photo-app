'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RenameClassroomDialog from '@/components/admin/RenameClassroomDialog';
import { Lock, Image, ShoppingCart, Eye, EyeOff, ArrowRight } from 'lucide-react';

type ClassroomCardProps = {
    classroom: {
        id: string;
        name: string;
        isLocked: boolean;
        isEditAllowed: boolean;
        teacherLogin: string;
        _count: {
            photos: number;
            orders: number;
        };
    };
    schoolId: string;
};

export default function ClassroomCard({ classroom, schoolId }: ClassroomCardProps) {
    const router = useRouter();

    // Функция маскировки логина
    const maskLogin = (login: string) => {
        if (login.length <= 8) return '••••••';
        return login.substring(0, 4) + '••••••' + login.substring(login.length - 2);
    };

    const handleCardClick = () => {
        router.push(`/admin/schools/${schoolId}/classrooms/${classroom.id}`);
    };

    return (
        <div className="group block h-full">
            <Card
                onClick={handleCardClick}
                className="h-full border border-slate-200 hover:border-slate-900 shadow-none transition-colors duration-200 bg-white cursor-pointer"
            >
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold text-slate-900 group-hover:underline underline-offset-4 decoration-1 transition-all flex items-center gap-2">
                            {classroom.name}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <RenameClassroomDialog
                                    classroomId={classroom.id}
                                    currentName={classroom.name}
                                    schoolId={schoolId}
                                />
                            </div>
                        </CardTitle>
                        {classroom.isLocked && (
                            <Badge variant="outline" className="border-slate-900 text-slate-900 text-[10px] h-5 px-1.5 rounded-sm font-normal">
                                <Lock className="w-2.5 h-2.5 mr-1" />
                                Закрыт
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                    {/* Статистика (Фото / Заказы) */}
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Image className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium">{classroom._count.photos}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium">{classroom._count.orders}</span>
                        </div>
                    </div>

                    {/* Информация об учителе */}
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                                    Логин учителя
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {classroom.isEditAllowed ? (
                                        <Eye className="w-3 h-3 text-slate-700 flex-shrink-0" />
                                    ) : (
                                        <EyeOff className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                    )}
                                    <code className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate w-full max-w-[120px]">
                                        {maskLogin(classroom.teacherLogin)}
                                    </code>
                                </div>
                            </div>

                            {classroom.isEditAllowed && (
                                <Badge variant="secondary" className="text-[9px] h-5 px-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 self-end mb-0.5">
                                    Ред. вкл
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Стрелка при наведении */}
                    <div className="flex items-center justify-end pt-1">
                        <span className="text-[10px] font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Открыть <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
