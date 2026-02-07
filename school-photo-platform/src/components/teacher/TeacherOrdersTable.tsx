'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Search,
    ExternalLink,
    Clock,
    CheckCircle,
    Package,
    User
} from 'lucide-react';
import type { TeacherOrder } from '@/actions/teacher/order-actions';
import { toggleOrderPaymentStatus } from '@/actions/teacher/order-actions';
import { toast } from 'sonner';

type TeacherOrdersTableProps = {
    orders: TeacherOrder[];
};

export default function TeacherOrdersTable({ orders }: TeacherOrdersTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();

    const filteredOrders = orders.filter((order) => {
        const fullName = `${order.parentName} ${order.parentSurname}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    const handlePaymentToggle = (orderId: string, checked: boolean) => {
        startTransition(async () => {
            try {
                await toggleOrderPaymentStatus(orderId, checked);
                toast.success(checked ? 'Оплачено' : 'Не оплачено');
                router.refresh();
            } catch (err: any) {
                toast.error('Ошибка обновления оплаты');
                console.error(err);
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2">
                        <Clock className="w-3 h-3" />
                        Ожидает
                    </Badge>
                );
            case 'APPROVED_BY_TEACHER':
                return (
                    <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 gap-1.5 px-2">
                        <CheckCircle className="w-3 h-3" />
                        Одобрено
                    </Badge>
                );
            case 'LOCKED':
                return (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 gap-1.5 px-2">
                        <Package className="w-3 h-3" />
                        В печати
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('ru-KZ', {
            style: 'currency',
            currency: 'KZT',
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Поиск по фамилии ученика..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 border-slate-200 focus:ring-slate-900"
                    />
                </div>
                <div className="text-sm text-slate-500 font-medium">
                    Всего заказов: <span className="text-slate-900">{filteredOrders.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-900">Ученик</TableHead>
                                <TableHead className="font-bold text-slate-900 text-center">Фото</TableHead>
                                <TableHead className="font-bold text-slate-900">Сумма</TableHead>
                                <TableHead className="font-bold text-slate-900">Оплата</TableHead>
                                <TableHead className="font-bold text-slate-900">Статус</TableHead>
                                <TableHead className="font-bold text-slate-900 text-right">Действие</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <User className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="font-medium text-slate-600">Заказы не найдены</p>
                                            <p className="text-xs mt-1">Попробуйте изменить поисковый запрос</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                                                    {order.parentSurname.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">
                                                        {order.parentSurname} {order.parentName}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-slate-700">
                                            {order.items.length} шт.
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {formatCurrency(order.totalAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`payment-${order.id}`}
                                                    checked={order.isPaid}
                                                    onCheckedChange={(checked: boolean) => handlePaymentToggle(order.id, checked)}
                                                    disabled={isPending}
                                                />
                                                <Label
                                                    htmlFor={`payment-${order.id}`}
                                                    className={`text-xs font-medium cursor-pointer ${order.isPaid ? 'text-green-600' : 'text-slate-400'}`}
                                                >
                                                    {order.isPaid ? 'Оплачено' : 'Не оплачено'}
                                                </Label>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-medium text-slate-700"
                                                onClick={() => router.push(`/teacher-dashboard?orderId=${order.id}`)}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Открыть
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
