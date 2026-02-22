'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Eye, MinusCircle, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import DownloadSchoolOrdersButton from '@/components/admin/DownloadSchoolOrdersButton';

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Ожидает',
    APPROVED_BY_TEACHER: 'Одобрен учителем',
    LOCKED: 'Заблокирован',
    COMPLETED: 'Выполнен',
};

type Order = {
    id: string;
    parentName: string;
    parentSurname: string;
    totalSum: number | string;
    status: string;
    isPaid: boolean;
    createdAt: string | Date;
    classroom: { name: string };
};

type AdminOrdersTableProps = {
    orders: Order[];
    schoolId: string;
    schoolName: string;
};

export default function AdminOrdersTable({ orders, schoolId, schoolName }: AdminOrdersTableProps) {
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

    const toggleExclude = (orderId: string) => {
        setExcludedIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const formatDate = (date: string | Date) => {
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const activeCount = orders.length - excludedIds.size;

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Заказы школы: {schoolName}</h1>
                    <p className="text-sm text-slate-500">
                        Всего заказов: {orders.length}
                        {excludedIds.size > 0 && (
                            <span className="ml-2 text-amber-600 font-medium">
                                (исключено: {excludedIds.size}, в скачивание: {activeCount})
                            </span>
                        )}
                    </p>
                </div>
                <DownloadSchoolOrdersButton
                    schoolId={schoolId}
                    totalOrders={activeCount}
                    excludedOrderIds={Array.from(excludedIds)}
                />
            </div>

            <div className="rounded-lg border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Класс</TableHead>
                            <TableHead>Родитель</TableHead>
                            <TableHead>Сумма</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Оплата</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead className="text-right">Действие</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => {
                            const isExcluded = excludedIds.has(order.id);
                            return (
                                <TableRow
                                    key={order.id}
                                    className={isExcluded ? 'opacity-40 bg-slate-50' : ''}
                                >
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={isExcluded
                                                ? 'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50'
                                                : 'h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50'
                                            }
                                            onClick={() => toggleExclude(order.id)}
                                            title={isExcluded ? 'Включить в скачивание' : 'Исключить из скачивания'}
                                        >
                                            {isExcluded ? (
                                                <PlusCircle className="w-5 h-5" />
                                            ) : (
                                                <MinusCircle className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-medium">{order.classroom.name}</TableCell>
                                    <TableCell>{order.parentName} {order.parentSurname}</TableCell>
                                    <TableCell>{formatPrice(Number(order.totalSum))}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{STATUS_LABELS[order.status] || order.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={order.isPaid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                            {order.isPaid ? 'Оплачено' : 'Не оплачено'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">{formatDate(order.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/schools/${schoolId}/orders/${order.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Просмотр
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
