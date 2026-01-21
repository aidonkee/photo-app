'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { ShoppingCart, Plus, Minus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  PhotoFormat,
  FORMAT_LABELS,
  formatPrice,
  getPrice,
  SchoolPricing,
} from '@/config/pricing';

type Photo = {
  id: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl: string | null;
  alt: string | null;
  width: number;
  height: number;
};

type PhotoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: Photo;
  allPhotos?:  Photo[];
  schoolPricing?: SchoolPricing | null;
  onPhotoChange?: (photo: Photo) => void;
};

function getWatermarkUrl(originalUrl: string): string {
  if (originalUrl.includes('/watermarked/')) {
    return originalUrl;
  }
  return `/api/watermark/view? url=${encodeURIComponent(originalUrl)}`;
}

export default function PhotoModal({
  open,
  onOpenChange,
  photo,
  allPhotos = [],
  schoolPricing,
  onPhotoChange,
}: PhotoModalProps) {
  const getDisplayUrl = (p: Photo) => {
    return p.watermarkedUrl;
  };
  const [format, setFormat] = useState<PhotoFormat>(PhotoFormat.A4);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const price = getPrice(format, schoolPricing);
  const totalPrice = price * quantity;

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const displayUrl = getWatermarkUrl(photo.watermarkedUrl);

  useEffect(() => {
    setFormat(PhotoFormat. A4);
    setQuantity(1);
    setShowSuccess(false);
  }, [photo.id]);

  const goToPrev = useCallback(() => {
    if (hasPrev && onPhotoChange) {
      onPhotoChange(allPhotos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, allPhotos, onPhotoChange]);

  const goToNext = useCallback(() => {
    if (hasNext && onPhotoChange) {
      onPhotoChange(allPhotos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, allPhotos, onPhotoChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrev, goToNext]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (! touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  const handleAddToCart = () => {
    addItem({
      photoId: photo.id,
      photoUrl: displayUrl,
      photoAlt: photo.alt,
      format,
      quantity,
      pricePerUnit: price,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="
          max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0
          md:max-w-5xl md:w-[900px] md:max-h-[85vh] md:overflow-hidden
        "
      >
        {/* Desktop Navigation Arrows - вынесены за пределы модалки */}
        {allPhotos.length > 1 && (
          <>
            {hasPrev && (
              <button
                onClick={goToPrev}
                className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white hover:bg-slate-100 text-slate-900 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-110"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={goToNext}
                className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white hover:bg-slate-100 text-slate-900 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-110"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </>
        )}

        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-200">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-slate-900">
            Выбор фотографии
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-600">
            {allPhotos.length > 1 ?  (
              <span>
                {currentIndex + 1} из {allPhotos.length} • Используйте ← → или свайп
              </span>
            ) : (
              <span>Выберите формат и количество</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Mobile:  single column, scrollable | Desktop: two columns, fixed height */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 md:h-[calc(85vh-120px)]">
          {/* Photo Preview */}
          <div
            className="space-y-3 relative md:flex md:flex-col md:h-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Desktop: fixed container for image | Mobile: auto height */}
            <div className="bg-slate-100 rounded-md overflow-hidden border border-slate-200 relative md:flex-1 md:flex md:items-center md:justify-center md:min-h-0">
              <img
                src={getDisplayUrl(photo)}
                alt={photo.alt || 'Фотография'}
                className="
                  w-full h-auto block
                  md:max-w-full md:max-h-full md:w-auto md:h-auto md:object-contain
                "
              />

              {/* Mobile Navigation Arrows */}
              {allPhotos.length > 1 && (
                <div className="md:hidden absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                  {hasPrev ?  (
                    <button
                      onClick={goToPrev}
                      className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-slate-900/70 hover:bg-slate-900 text-white rounded-full shadow-lg active:scale-95 transition-all"
                      aria-label="Предыдущее фото"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-10" />
                  )}

                  {hasNext ? (
                    <button
                      onClick={goToNext}
                      className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-slate-900/70 hover:bg-slate-900 text-white rounded-full shadow-lg active:scale-95 transition-all"
                      aria-label="Следующее фото"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-10" />
                  )}
                </div>
              )}
            </div>

            {allPhotos.length > 1 && (
              <p className="md:hidden text-center text-xs text-slate-400">
                👆 Свайп влево/вправо для навигации
              </p>
            )}
          </div>

          {/* Options - Desktop:  scrollable if needed */}
          <div className="space-y-4 md:overflow-y-auto md:max-h-full">
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
                        </div>
                        <span className="font-semibold text-sm text-slate-900 whitespace-nowrap">
                          {formatPrice(getPrice(fmt, schoolPricing))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Цена за единицу:</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {formatPrice(price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Количество:</span>
                <span className="font-medium text-slate-900 tabular-nums">×{quantity}</span>
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

            {showSuccess && (
              <Alert className="bg-slate-900 border-slate-900 text-white">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <AlertDescription className="text-white">
                  Успешно добавлено в корзину!
                </AlertDescription>
              </Alert>
            )}

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