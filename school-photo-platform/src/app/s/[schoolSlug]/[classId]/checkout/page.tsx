'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import CheckoutForm from '@/components/parent/CheckoutForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice, FORMAT_LABELS } from '@/config/pricing';
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: Promise<{
    schoolSlug: string;
    classId: string;
  }>;
};

export default function CheckoutPage({ params }: PageProps) {
  const { schoolSlug, classId } = use(params);
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const totalPrice = getTotalPrice();

  React.useEffect(() => {
    if (items.length === 0) {
      router.push(`/s/${schoolSlug}/${classId}`);
    }
  }, [items.length, router, schoolSlug, classId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/s/${schoolSlug}/${classId}`}>
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Назад к галерее
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">Оформление заказа</h1>
          <p className="text-slate-600 mt-2">
            Проверьте ваш заказ и введите контактную информацию
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Сводка заказа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.photoId}-${item.format}`}
                    className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.photoUrl}
                        alt={item.photoAlt || 'Фото'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.photoAlt || 'Фото'}
                      </p>
                      <p className="text-xs text-slate-600">
                        {FORMAT_LABELS[item.format]}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-slate-600">
                          ×{item.quantity}
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatPrice(item.pricePerUnit * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(item.photoId, item.format)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Промежуточный итог:</span>
                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Налог:</span>
                    <span className="font-medium">—</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Итого:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 text-xs text-slate-500 space-y-1">
                  <p>✓ Водяные знаки будут удалены с финальных отпечатков</p>
                  <p>✓ Печать высокого качества</p>
                  <p>✓ Подтверждение заказа будет отправлено на email</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm classId={classId} schoolSlug={schoolSlug} />
          </div>
        </div>
      </div>
    </div>
  );
}