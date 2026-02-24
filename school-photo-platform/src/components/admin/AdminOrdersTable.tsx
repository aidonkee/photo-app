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
import { Eye, MinusCircle, PlusCircle, Trash2, CheckCircle, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DownloadSchoolOrdersButton from '@/components/admin/DownloadSchoolOrdersButton';
import { deleteSelectedOrdersAction, deleteAllSchoolOrdersAction } from '@/actions/admin/order-actions';
import { toast } from 'sonner';

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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const toggleSelect = (orderId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const handleDeleteSelected = async () => {
        if (!confirm('Вы уверены, что хотите удалить выбранные заказы? Это действие необратимо.')) return;
        setIsDeleting(true);
        try {
            await deleteSelectedOrdersAction(schoolId, Array.from(selectedIds));
            toast.success('Заказы успешно удалены');
            setSelectedIds(new Set());
            router.refresh();
        } catch (error) {
            toast.error('Не удалось удалить заказы');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Вы уверены, что хотите удалить ВСЕ заказы школы? Это действие полностью очистит список заказов.')) return;
        setIsDeleting(true);
        try {
            await deleteAllSchoolOrdersAction(schoolId);
            toast.success('Все заказы школы удалены');
            setSelectedIds(new Set());
            router.refresh();
        } catch (error) {
            toast.error('Не удалось удалить заказы');
        } finally {
            setIsDeleting(false);
        }
    };

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
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Удалить ({selectedIds.size})
                        </Button>
                    )}
                    {orders.length > 0 && selectedIds.size === 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAll}
                            disabled={isDeleting}
                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Удалить Все
                        </Button>
                    )}
                    <DownloadSchoolOrdersButton
                        schoolId={schoolId}
                        totalOrders={activeCount}
                        excludedOrderIds={Array.from(excludedIds)}
                    />
                </div>
            </div>

            <div className="rounded-lg border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="w-12 text-center" title="Удалить">
                                <Trash2 className="w-4 h-4 text-slate-400 mx-auto" />
                            </TableHead>
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
                            const isSelected = selectedIds.has(order.id);
                            return (
                                <TableRow
                                    key={order.id}
                                    className={isExcluded ? 'opacity-40 bg-slate-50' : (isSelected ? 'bg-red-50/50' : '')}
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
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => toggleSelect(order.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            {isSelected ? (
                                                <CheckCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <Circle className="w-5 h-5" />
                                            )}
                                        </button>
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
