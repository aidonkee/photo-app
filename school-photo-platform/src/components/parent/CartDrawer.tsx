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
  ShoppingBag
} from 'lucide-react';
import { formatPrice, FORMAT_LABELS, getPrice } from '@/config/pricing';
import CheckoutForm from '@/components/parent/CheckoutForm';
import Image from 'next/image';

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  schoolSlug: string;
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

  const [showCheckout, setShowCheckout] = useState(false);
  const totalPrice = getTotalPrice();

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => setShowCheckout(false), 300);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l-0 sm:border-l">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            {showCheckout && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={() => setShowCheckout(false)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            {showCheckout ? 'Оформление' : 'Корзина'}
            {!showCheckout && items.length > 0 && (
              <span className="ml-auto bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                {items.length} фото
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {showCheckout
              ? 'Введите данные для получения заказа'
              : 'Проверьте выбранные снимки перед оплатой'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {showCheckout ? (
            <ScrollArea className="flex-1 px-6">
              <div className="py-4 space-y-6">
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg shadow-slate-200">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Итого к оплате</p>
                      <p className="text-2xl font-bold">{formatPrice(totalPrice)}</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 opacity-20" />
                  </div>
                </div>

                <CheckoutForm
                  classId={classId}
                  schoolSlug={schoolSlug}
                />
              </div>
            </ScrollArea>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6">
                <div className="py-4 space-y-5">
                  {items.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">Ваша корзина пуста</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={`${item.photoId}-${item.format}`}
                        className="flex gap-4 group"
                      >
                        {/* МИНИАТЮРА ФОТО */}
                        <div className="relative w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                          <Image
                            src={item.photoThumbnail || ''} 
                            alt={item.photoAlt || 'Фото'}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-sm text-slate-900 leading-tight">
                                {item.photoAlt || 'Фотография'}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-300 hover:text-red-500 -mt-1 -mr-2"
                                onClick={() => removeItem(item.photoId, item.format)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                              {FORMAT_LABELS[item.format]}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border rounded-full p-0.5 bg-white">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => updateQuantity(item.photoId, item.format, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => updateQuantity(item.photoId, item.format, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-sm text-slate-900">
                              {formatPrice(getPrice(item.format) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {items.length > 0 && (
                <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 font-medium">Итоговая сумма:</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <Button
                    className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all active:scale-[0.98]"
                    onClick={() => setShowCheckout(true)}
                  >
                    Перейти к оформлению
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}