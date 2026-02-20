import React from 'react';
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
  ShoppingCart,
  Package,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import DownloadSchoolOrdersButton from '@/components/admin/DownloadSchoolOrdersButton';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

const STATUS_LABELS = {
  PENDING: 'Ожидает',
  APPROVED_BY_TEACHER: 'Одобрен учителем',
  LOCKED: 'Заблокирован',
  COMPLETED: 'Выполнен',
} as const;

export default async function AdminSchoolOrdersPage({ params }: PageProps) {
  const { schoolId } = await params;
  const [school, orders] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolOrders(schoolId),
  ]);

  const formatDate = (date: Date) => {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/schools/${schoolId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Заказы школы: {school.name}</h1>
            <p className="text-sm text-slate-500">Всего заказов: {orders.length}</p>
          </div>
        </div>
        <DownloadSchoolOrdersButton schoolId={schoolId} totalOrders={orders.length} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.classroom.name}</TableCell>
                  <TableCell>{order.parentName} {order.parentSurname}</TableCell>
                  <TableCell>{formatPrice(Number(order.totalSum))}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABELS[order.status]}</Badge>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}