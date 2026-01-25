'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RequestEditDialog from './RequestEditDialog';
import { Image as ImageIcon, AlertCircle, Info, Minus, Loader2 } from 'lucide-react';
import type { TeacherOrder } from '@/actions/teacher/order-actions';
import { decreaseOrderItemQuantity } from '@/actions/teacher/order-actions';
import { Button } from '@/components/ui/button';

type OrderDetailViewProps = {
  order: TeacherOrder | null;
  canEdit: boolean;
};

export default function OrderDetailView({ order, canEdit }: OrderDetailViewProps) {
  const router = useRouter();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Заказ не выбран</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Выберите родителя из списка, чтобы проверить фотографии
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            Ожидает проверки
          </Badge>
        );
      case 'APPROVED_BY_TEACHER':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            Одобрено
          </Badge>
        );
      case 'LOCKED':
        return <Badge variant="outline">В печати</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">Завершено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      A4: 'A4 (21×30 см)',
      A5: 'A5 (15×21 см)',
    };
    return labels[format] || format;
  };

  const handleDecrease = (itemId: string) => {
    setError(null);
    setPendingItemId(itemId);
    startTransition(async () => {
      try {
        await decreaseOrderItemQuantity(itemId, 1);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || 'Не удалось изменить количество');
      } finally {
        setPendingItemId(null);
      }
    });
  };

  const isLocked = useMemo(
    () => order.status === 'LOCKED' || order.status === 'COMPLETED',
    [order.status]
  );

  const canEditNow = canEdit && !isLocked;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {!canEdit && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Редактирование корзины запрещено. Отправьте запрос на разрешение.
          </AlertDescription>
        </Alert>
      )}

      {isLocked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Заказ заблокирован и не может быть изменён.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {order.parentSurname} {order.parentName}
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>{formatDate(order.createdAt)}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{order.items.length} фото</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="font-medium text-slate-900">{formatCurrency(order.totalAmount)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {getStatusBadge(order.status)}
            <RequestEditDialog parentName={`${order.parentName} ${order.parentSurname}`} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-900">Фотографии ({order.items.length})</h3>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
            <Info className="w-3 h-3" />
            Без водяных знаков
          </span>
        </div>

        {order.items.map((item, index) => (
          <Card key={item.id} className="overflow-hidden border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-64 sm:h-auto bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {item.photo.watermarkedUrl ? (
                    <Image
                      src={item.photo.watermarkedUrl}
                      alt={item.photo.alt || `Фотография ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                    #{index + 1}
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <h4 className="font-medium text-slate-900 text-base line-clamp-2">
                        {item.photo.alt || `Фотография №${index + 1}`}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-600 text-xs whitespace-nowrap">
                          {item.quantity} шт
                        </Badge>
                        {canEditNow && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-rose-600 hover:text-rose-700"
                            disabled={pendingItemId === item.id || isPending || item.quantity <= 0}
                            onClick={() => handleDecrease(item.id)}
                            title="Удалить 1 шт"
                          >
                            {pendingItemId === item.id || isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      Формат: <span className="text-slate-700 font-medium">{getFormatLabel(item.format)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                    <span className="text-xs text-slate-400">
                      Цена за шт: {formatCurrency(item.pricePerUnit)}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.pricePerUnit * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border shadow-lg sm:shadow-none z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <span className="text-sm text-slate-500">Итого к оплате:</span>
          <span className="text-xl font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}