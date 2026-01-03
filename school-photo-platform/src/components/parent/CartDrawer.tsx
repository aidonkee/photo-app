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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
} from 'lucide-react';
import { formatPrice, FORMAT_LABELS, getPrice } from '@/config/pricing';
import CheckoutForm from '@/components/parent/CheckoutForm'; // Импортируем форму

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  schoolSlug: string; // Добавили slug школы для редиректа
};

export default function CartDrawer({
  open,
  onOpenChange,
  classId,
  schoolSlug,
}: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  
  // Состояние: false = список товаров, true = форма оплаты
  const [showCheckout, setShowCheckout] = useState(false);

  const totalPrice = getTotalPrice();

  // Функция для сброса состояния при закрытии
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => setShowCheckout(false), 300); // Сбрасываем на список товаров при закрытии
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
            {showCheckout ? 'Оформление заказа' : 'Корзина'}
          </SheetTitle>
          <SheetDescription>
            {showCheckout 
              ? 'Заполните контактные данные для завершения.' 
              : 'Просмотрите выбранные фотографии.'}
          </SheetDescription>
        </SheetHeader>

        {showCheckout ? (
          /* --- ПОКАЗЫВАЕМ ФОРМУ ОФОРМЛЕНИЯ --- */
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex justify-between font-medium mb-2">
                <span>Всего к оплате:</span>
                <span className="text-blue-600">{formatPrice(totalPrice)}</span>
              </div>
              <p className="text-xs text-slate-500">
                Вы выбрали {items.reduce((acc, item) => acc + item.quantity, 0)} фото
              </p>
            </div>
            
            <CheckoutForm 
              classId={classId} 
              schoolSlug={schoolSlug} 
            />
          </div>
        ) : (
          /* --- ПОКАЗЫВАЕМ СПИСОК ТОВАРОВ --- */
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6">
                {items.length === 0 ? (
                  <Alert>
                    <AlertDescription>Ваша корзина пуста.</AlertDescription>
                  </Alert>
                ) : (
                  items.map((item) => (
                    <div key={`${item.photoId}-${item.format}`} className="flex flex-col gap-3 pb-4 border-b last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm line-clamp-1">
                            {/* Здесь можно добавить миниатюру фото, если она есть в item */}
                           {item.photoAlt || 'Фотография'} 
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {FORMAT_LABELS[item.format]}
                          </p>
                        </div>
                        <p className="font-medium text-sm">
                          {formatPrice(getPrice(item.format) * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-1 rounded-md">
                         <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white shadow-sm"
                              onClick={() => updateQuantity(item.photoId, item.format, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white shadow-sm"
                              onClick={() => updateQuantity(item.photoId, item.format, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                         </div>
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(item.photoId, item.format)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="pt-6 mt-auto bg-white border-t space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium">Итого:</p>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(totalPrice)}</p>
              </div>
              <Button
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
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