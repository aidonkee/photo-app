import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, FORMAT_LABELS } from '@/config/pricing';
import {
  ArrowLeft,
  CheckCircle,
  Mail,
  Phone,
  Package,
} from 'lucide-react';

// Import the client component for the approve button
import ApproveOrderButton from '@/components/teacher/ApproveOrderButton'
type PageProps = {
  params: Promise<{
    classId: string;
    orderId: string;
  }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    redirect('/login');
  }

  const { classId, orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId, classId },
    include: {
      items: {
        include: {
          photo: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/classroom/${classId}`}>
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Назад к панели управления
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Заказ от {order.parentName} {order.parentSurname}
            </h1>
            <p className="text-slate-600 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <Badge className="bg-blue-600 text-base px-4 py-2">
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Parent Info */}
      <Card>
        <CardHeader>
          <CardTitle>Контактные данные родителя</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Электронная почта</p>
              <p className="font-medium text-slate-400 italic">Не хранится (конфиденциальность)</p>
            </div>
          </div>
          {order.parentPhone && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Phone className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Телефон</p>
                <p className="font-medium">{order.parentPhone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Товары в заказе ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg"
              >
                <div className="w-20 h-20 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.photoUrl} 
                      alt="Фото из заказа" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    Фото #{index + 1}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {FORMAT_LABELS[item.format as keyof typeof FORMAT_LABELS]}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-slate-600">
                      Количество: {item.quantity}
                    </span>
                    <span className="text-slate-600">
                      Цена: {formatPrice(Number(item.price))}
                    </span>
                    <span className="font-semibold text-green-600">
                      Итого: {formatPrice(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t flex items-center justify-between">
            <span className="text-lg font-semibold">Общая сумма заказа: </span>
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(Number(order.totalSum))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Approve Button (Only if Pending) */}
      {order.status === 'PENDING' && (
        <ApproveOrderButton orderId={order.id} classId={classId} />
      )}
    </div>
  );
}
