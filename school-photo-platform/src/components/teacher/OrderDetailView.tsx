'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RequestEditDialog from './RequestEditDialog';
import {
  Image,
  Package,
  DollarSign,
  Calendar,
  Phone,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { TeacherOrder } from '@/actions/teacher/order-actions';

type OrderDetailViewProps = {
  order: TeacherOrder | null;
};

export default function OrderDetailView({ order }: OrderDetailViewProps) {
  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Image className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Заказ не выбран
          </h3>
          <p className="text-slate-600">
            Выберите родителя из списка слева, чтобы просмотреть детали заказа
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            Ожидает проверки
          </Badge>
        );
      case 'APPROVED_BY_TEACHER':
        return <Badge className="bg-slate-900">Одобрено</Badge>;
      case 'LOCKED':
        return <Badge className="bg-slate-900">Заблокировано для печати</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-slate-900">Завершено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      A4: 'Печать A4 (21 × 29.7 см)',
      A5: 'Печать A5 (14.8 × 21 см)',
    };
    return labels[format] || format;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Заказ от {order.parentName} {order.parentSurname}
          </h2>
          <p className="text-slate-600 mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <RequestEditDialog
            parentName={`${order.parentName} ${order.parentSurname}`}
          />
        </div>
      </div>

      {/* Информация о заказе */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Всего товаров</p>
                <p className="text-2xl font-bold text-slate-900">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Сумма заказа</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Image className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Фотографий</p>
                <p className="text-2xl font-bold text-slate-900">
                  {order.items.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Дата заказа</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Контактные данные родителя */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Контактная информация родителя</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.parentPhone && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Телефон</p>
                  <p className="text-sm font-medium text-slate-900">
                    {order.parentPhone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Предупреждение */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Проверьте внимательно:</strong> убедитесь, что все фотографии
          правильные перед одобрением. Если есть ошибки (не тот ученик, плохая
          обрезка и т.д.), нажмите «Сообщить о проблеме» выше.
        </AlertDescription>
      </Alert>

      {/* Фотографии */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Заказанные фотографии ({order.items.length})</CardTitle>
            <Alert className="bg-slate-50 border-slate-200 py-2 px-3">
              <Info className="h-3 w-3 text-slate-900" />
              <AlertDescription className="text-xs text-slate-700 ml-2">
                Водяные знаки будут удалены при печати
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={item.id}
                className="border-2 border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                    <Image className="w-12 h-12 text-slate-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-lg">
                          Фото №{index + 1}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {item.photo.alt || 'Без названия'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.quantity} × {getFormatLabel(item.format)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="text-sm">
                        <span className="text-slate-500">Формат:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {getFormatLabel(item.format)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Количество:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Цена за штуку:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {formatCurrency(item.pricePerUnit)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Подытог:</span>
                        <span className="ml-2 font-bold text-slate-900">
                          {formatCurrency(item.pricePerUnit * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">
                Итого по заказу:
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
