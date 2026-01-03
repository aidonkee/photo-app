'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Plus, Minus, CheckCircle2, X } from 'lucide-react';
import {
  PhotoFormat,
  FORMAT_LABELS,
  FORMAT_DESCRIPTIONS,
  formatPrice,
  getPrice,
} from '@/config/pricing';

type PhotoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: {
    id: string;
    watermarkedUrl: string;
    alt: string | null;
  };
};

export default function PhotoModal({
  open,
  onOpenChange,
  photo,
}:  PhotoModalProps) {
  const [format, setFormat] = useState<PhotoFormat>(PhotoFormat.A4);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const price = getPrice(format);
  const totalPrice = price * quantity;

  const handleAddToCart = () => {
    addItem({
      photoId: photo.id,
      photoUrl: photo.watermarkedUrl,
      photoAlt: photo.alt,
      format,
      quantity,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onOpenChange(false);
      setFormat(PhotoFormat.A4);
      setQuantity(1);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-200">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Выбор опций фотографии
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Выберите формат и количество, затем добавьте в корзину
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md: grid-cols-2 gap-6 p-6">
          {/* Photo Preview */}
          <div className="space-y-3">
            <div className="aspect-square bg-slate-100 rounded-md overflow-hidden border border-slate-200">
              <img
                src={photo.watermarkedUrl}
                alt={photo.alt || 'Фотография'}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 text-center bg-slate-50 py-2 rounded-md">
              Водяной знак будет удален на финальном отпечатке
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format" className="text-sm font-medium text-slate-900">
                Формат
              </Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as PhotoFormat)}
              >
                <SelectTrigger id="format" className="h-11 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PhotoFormat).map((fmt) => (
                    <SelectItem key={fmt} value={fmt} className="cursor-pointer py-3">
                      <div className="flex items-start justify-between w-full gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-900">
                            {FORMAT_LABELS[fmt]}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {FORMAT_DESCRIPTIONS[fmt]}
                          </p>
                        </div>
                        <span className="font-semibold text-sm text-slate-900 whitespace-nowrap">
                          {formatPrice(getPrice(fmt))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Количество</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 border-slate-300"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full text-center text-xl font-semibold border border-slate-300 rounded-md py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 border-slate-300"
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  disabled={quantity >= 99}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Цена за единицу:</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {formatPrice(price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Количество:</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  ×{quantity}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Итого:</span>
                  <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <Alert className="bg-slate-900 border-slate-900 text-white">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <AlertDescription className="text-white">
                  Успешно добавлено в корзину!
                </AlertDescription>
              </Alert>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={showSuccess}
              className="w-full h-11 text-base bg-slate-900 hover:bg-slate-800"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Добавить в корзину
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}