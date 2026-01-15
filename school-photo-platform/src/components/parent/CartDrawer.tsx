'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
} from 'lucide-react';
import { formatPrice, FORMAT_LABELS, SchoolPricing } from '@/config/pricing';
import CheckoutForm from '@/components/parent/CheckoutForm';

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  schoolSlug: string;
  schoolPricing?:  SchoolPricing | null;
};

export default function CartDrawer({
  open,
  onOpenChange,
  classId,
  schoolSlug,
  schoolPricing,
}: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const [showCheckout, setShowCheckout] = useState(false);

  const totalPrice = getTotalPrice();

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (! isOpen) {
      setTimeout(() => setShowCheckout(false), 300);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            {showCheckout && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2 mr-1"
                onClick={() => setShowCheckout(false)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {showCheckout ?  'Оформление заказа' : 'Корзина'}
          </SheetTitle>
          <SheetDescription>
            {showCheckout
              ? 'Заполните контактные данные для завершения заказа.'
              : 'Просмотрите выбранные фотографии. '}
          </SheetDescription>
        </SheetHeader>

        {showCheckout ?  (
          /* ОФОРМЛЕНИЕ ЗАКАЗА */
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex justify-between font-medium mb-2">
                <span>Всего к оплате:</span>
                <span className="text-slate-900 font-semibold">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Вы выбрали {items.reduce((acc, item) => acc + item.quantity, 0)} фото
              </p>
            </div>

            <CheckoutForm classId={classId} schoolSlug={schoolSlug} />
          </div>
        ) : (
          /* КОРЗИНА С ПРЕВЬЮ */
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {items.length === 0 ? (
                  <Alert>
                    <AlertDescription>Ваша корзина пуста. </AlertDescription>
                  </Alert>
                ) : (
                  items.map((item) => (
                    <div
                      key={`${item.photoId}-${item.format}`}
                      className="flex gap-3 pb-4 border-b border-slate-200 last:border-0"
                    >
                      {/* ✅ ПРЕВЬЮ ФОТОГРАФИИ */}
                      <div className="relative flex-shrink-0 w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={item.photoUrl}
                          alt={item.photoAlt || 'Фото'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* ИНФОРМАЦИЯ О ТОВАРЕ */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Верхняя часть:  формат + цена */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {FORMAT_LABELS[item.format]}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {item.photoAlt || 'Фотография'}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                            {formatPrice(item.pricePerUnit * item.quantity)}
                          </p>
                        </div>

                        {/* Нижняя часть: кнопки управления */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-slate-50 rounded-md p-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-white shadow-sm hover:bg-slate-100"
                              onClick={() =>
                                updateQuantity(
                                  item.photoId,
                                  item. format,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            <span className="w-8 text-center text-sm font-medium text-slate-900">
                              {item.quantity}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-white shadow-sm hover:bg-slate-100"
                              onClick={() =>
                                updateQuantity(item.photoId, item.format, item.quantity + 1)
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(item.photoId, item.format)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* ИТОГО */}
            <div className="pt-6 mt-auto bg-white border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium text-slate-700">Итого: </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatPrice(totalPrice)}
                </p>
              </div>

              <Button
                className="w-full h-12 text-base bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => setShowCheckout(true)}
                disabled={items.length === 0}
              >
                Оформить заказ
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}