import React, { use } from 'react';
import Link from 'next/link';
import { getOrderDetails } from '@/actions/admin/order-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  CreditCard,
  Package,
} from 'lucide-react';
import DownloadOrderButton from '@/components/admin/DownloadOrderButton';

type PageProps = {
  params: Promise<{
    schoolId: string;
    orderId: string;
  }>;
};

const STATUS_LABELS = {
  PENDING: 'Ожидает подтверждения',
  APPROVED_BY_TEACHER: 'Одобрен учителем',
  LOCKED:  'Заблокирован',
  COMPLETED: 'Выполнен',
} as const;

const FORMAT_LABELS = {
  A4: 'A4 (21×29.7 см)',
  A5: 'A5 (14.8×21 см)',
} as const;

export default async function OrderDetailsPage({ params }: PageProps) {
  const { schoolId, orderId } = await params;
  const order = await getOrderDetails(orderId);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day:   '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatPrice = (amount:   number) => {
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
        <Link href={`/admin/schools/${schoolId}/orders`}>
          <Button variant="ghost" className="gap-2 mb-4 -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Назад к заказам
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Заказ #{order.id.  slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {order.classroom.school.name} • {order.classroom.name}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* ✅ КНОПКА СКАЧИВАНИЯ ZIP */}
            <DownloadOrderButton orderId={order.id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                Информация о заказчике
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Родитель</p>
                  <p className="text-sm font-medium text-slate-900">
                    {order.parentName} {order.parentSurname}
                  </p>
                </div>
              </div>
              {order.parentPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Телефон</p>
                    <p className="text-sm font-medium text-slate-900 font-mono">
                      {order.parentPhone}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                Купленные фотографии ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {order.items.  map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative bg-slate-100 rounded-md border border-slate-200 overflow-hidden h-48"
                  >
                    <img
                      src={item.  photo.  thumbnailUrl || item.photo.watermarkedUrl}
                      alt={item.  photo.alt || `Фото ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs text-white font-medium">
                          {FORMAT_LABELS[item.format as keyof typeof FORMAT_LABELS]}
                        </p>
                        <p className="text-xs text-white/80">
                          {item.quantity} шт.  × {formatPrice(Number(item.price))}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-slate-200">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white sticky top-6">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                Детали заказа
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Статус</span>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </div>

                <Separator className="bg-slate-100" />

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Создан</p>
                    <p className="text-sm text-slate-900 font-mono">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.completedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Выполнен</p>
                      <p className="text-sm text-slate-900 font-mono">
                        {formatDate(order.completedAt)}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-100" />

                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Количество фото</p>
                    <p className="text-sm font-medium text-slate-900">
                      {order.items.  reduce((sum, item) => sum + item.quantity, 0)} шт.
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-semibold text-slate-900">Итого</span>
                  <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {formatPrice(Number(order.totalSum))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}