import React, { use } from 'react';
import Link from 'next/link';
import { getSchoolOrders } from '@/actions/admin/order-actions';
import { getSchoolById } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Eye,
} from 'lucide-react';
import DownloadSchoolOrdersButton from '@/components/admin/DownloadSchoolOrdersButton';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

const STATUS_LABELS = {
  PENDING: 'Ожидает',
  APPROVED_BY_TEACHER: 'Одобрен учителем',
  LOCKED:  'Заблокирован',
  COMPLETED: 'Выполнен',
} as const;

const STATUS_VARIANTS = {
  PENDING: 'outline',
  APPROVED_BY_TEACHER: 'outline',
  LOCKED: 'outline',
  COMPLETED: 'outline',
} as const;

export default async function SchoolOrdersPage({ params }:  PageProps) {
  const { schoolId } = await params;
  
  const [school, orders] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolOrders(schoolId),
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month:  '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits:  0,
      maximumFractionDigits:  0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <Link href={`/admin/schools/${schoolId}`}>
          <Button variant="ghost" className="gap-2 mb-4 -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Назад к школе
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-md">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Заказы школы
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {school. name} • {orders.length} {orders.length === 1 ? 'заказ' : 'заказов'}
              </p>
            </div>
          </div>

          {/* ✅ КНОПКА СКАЧИВАНИЯ ВСЕХ ЗАКАЗОВ */}
          <DownloadSchoolOrdersButton 
            schoolId={schoolId} 
            totalOrders={orders.length} 
          />
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-slate-50/30">
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 bg-white rounded-lg border border-slate-200 mb-4">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Заказы отсутствуют
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Заказы от родителей будут отображаться здесь после оформления
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              Все заказы ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-900">Номер</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Класс</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Родитель</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Фото</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Сумма</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Статус</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Дата</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                    <TableCell className="font-mono text-xs text-slate-700">
                      #{String(orders.length - index).padStart(3, '0')}
                    </TableCell>
                    <TableCell className="text-sm text-slate-900 font-medium">
                      {order.classroom.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {order.parentName} {order.parentSurname}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {order._count. items} шт.
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900 tabular-nums">
                      {formatPrice(Number(order. totalSum))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[order.status]} className="text-xs border-slate-300 text-slate-700">
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/schools/${schoolId}/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:text-slate-900">
                          <Eye className="w-4 h-4" />
                          Открыть
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}