'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useTranslation } from '@/stores/language-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, CheckCircle2, ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import {
  PhotoFormat,
  FORMAT_LABELS,
  formatPrice,
  getPrice,
  SchoolPricing,
} from '@/config/pricing';
import { cn } from '@/lib/utils';

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
  allPhotos?: Photo[];
  schoolPricing?: SchoolPricing | null;
  onPhotoChange?: (photo: Photo) => void;
  classId: string;
};

function getWatermarkUrl(originalUrl: string): string {
  if (originalUrl.includes('/watermarked/')) {
    return originalUrl;
  }
  return `/api/watermark/view?url=${encodeURIComponent(originalUrl)}`;
}

export default function PhotoModal({
  open,
  onOpenChange,
  photo,
  allPhotos = [],
  schoolPricing,
  onPhotoChange,
  classId,
}: PhotoModalProps) {
  const { t } = useTranslation();

  const getDisplayUrl = (p: Photo) => {
    return p.watermarkedUrl;
  };

  const [quantities, setQuantities] = useState<Record<PhotoFormat, number>>({
    [PhotoFormat.A4]: 0,
    [PhotoFormat.A5]: 0,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const totalPrice = Object.entries(quantities).reduce((acc, [fmt, qty]) => {
    return acc + getPrice(fmt as PhotoFormat, schoolPricing) * qty;
  }, 0);

  const totalItemsCount = Object.values(quantities).reduce((acc, qty) => acc + qty, 0);

  const currentIndex = useMemo(() => {
    if (!photo) return -1;
    return allPhotos.findIndex(p => p.id === photo.id);
  }, [allPhotos, photo]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const displayUrl = getWatermarkUrl(photo.watermarkedUrl);

  useEffect(() => {
    setQuantities({
      [PhotoFormat.A4]: 0,
      [PhotoFormat.A5]: 0,
    });
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
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  const updateQuantity = (format: PhotoFormat, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [format]: Math.max(0, (prev[format] || 0) + delta)
    }));
  };

  const handleAddToCart = () => {
    if (totalItemsCount === 0) return;

    Object.entries(quantities).forEach(([fmt, qty]) => {
      if (qty > 0) {
        addItem({
          classId,
          photoId: photo.id,
          photoUrl: displayUrl,
          photoAlt: photo.alt,
          format: fmt as PhotoFormat,
          quantity: qty,
          pricePerUnit: getPrice(fmt as PhotoFormat, schoolPricing),
        });
      }
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-none !w-screen !h-screen !p-0 !gap-0 !border-0 !rounded-none overflow-hidden bg-black flex flex-col"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t('select_photo')}</DialogTitle>

        {/* Main Photo Container with All Overlays */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Photo */}
          <img
            src={getDisplayUrl(photo)}
            alt={photo.alt || t('photo')}
            className="max-w-full max-h-full object-contain"
          />

          {/* Top Bar - Back & Close Buttons */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-2 sm:p-3 md:p-4">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white gap-1 sm:gap-2 rounded-full shadow-lg border-0 font-medium text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('back')}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Navigation Arrows */}
          {allPhotos.length > 1 && (
            <>
              {hasPrev && (
                <button
                  onClick={goToPrev}
                  className="absolute left-2 sm:left-3 md:left-6 z-40 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full transition-all shadow-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                </button>
              )}

              {hasNext && (
                <button
                  onClick={goToNext}
                  className="absolute right-2 sm:right-3 md:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full transition-all shadow-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                </button>
              )}
            </>
          )}

          {/* Bottom Controls - Format Selection & Cart */}
          <div className="absolute bottom-0 left-0 right-0 z-40 p-2 sm:p-4 md:p-6 space-y-2 sm:space-y-3">
            {/* Format Selection */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-2xl mx-auto">
              {Object.values(PhotoFormat).map((fmt) => {
                const qty = quantities[fmt] || 0;
                const itemPrice = getPrice(fmt, schoolPricing);
                const isSelected = qty > 0;

                return (
                  <div
                    key={fmt}
                    className={cn(
                      "flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all flex-1 shadow-lg backdrop-blur-md border-2 border-black",
                      isSelected
                        ? "bg-green-100"
                        : "bg-white/90"
                    )}
                  >
                    <div className="flex flex-col mr-2 sm:mr-3">
                      <span className="font-extrabold text-sm sm:text-base md:text-lg text-black">
                        {FORMAT_LABELS[fmt]}
                      </span>
                      <span className="text-xs sm:text-sm md:text-base font-bold text-black/80">
                        {formatPrice(itemPrice)}
                      </span>
                    </div>

                    <div className="flex items-center rounded-lg sm:rounded-xl shadow-sm bg-black/5 border border-black/10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-l-lg sm:rounded-l-xl hover:bg-black/10 text-black"
                        onClick={() => updateQuantity(fmt, -1)}
                        disabled={qty <= 0}
                      >
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <span className="w-8 sm:w-10 md:w-12 text-center font-extrabold text-base sm:text-lg md:text-xl text-black">
                        {qty}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-r-lg sm:rounded-r-xl hover:bg-black/10 text-black"
                        onClick={() => updateQuantity(fmt, 1)}
                        disabled={qty >= 99}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add to Cart Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleAddToCart}
                disabled={totalItemsCount === 0 || showSuccess}
                className={cn(
                  "w-full sm:max-w-md h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-bold shadow-2xl transition-all backdrop-blur-sm text-white",
                  showSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700",
                  totalItemsCount === 0 && "opacity-50"
                )}
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    <span>{t('added_to_cart')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    <span className="font-extrabold">
                      {t('add_to_cart')}
                      {totalPrice > 0 && (
                        <span className="ml-1 sm:ml-2">
                          • {formatPrice(totalPrice)}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}