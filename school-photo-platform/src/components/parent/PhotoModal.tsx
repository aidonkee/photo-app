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
import { ShoppingCart, Plus, Minus, CheckCircle2, ChevronLeft, ChevronRight, X, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useParams } from 'next/navigation';
import CartDrawer from './CartDrawer';
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
  fileName: string | null;
  uploadedAt?: string | Date;
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
  const params = useParams();
  const schoolSlug = params?.schoolSlug as string;

  const [cartOpen, setCartOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const totalCartPrice = useCartStore((state) => state.getTotalPrice(classId));

  const getDisplayUrl = (p: Photo) => {
    return p.watermarkedUrl;
  };

  const [quantities, setQuantities] = useState<Record<PhotoFormat, number>>({
    [PhotoFormat.A4]: 0,
    [PhotoFormat.A5]: 0,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

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
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const xDistance = touchStart.x - touchEnd.x;
    const yDistance = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(xDistance) > Math.abs(yDistance);

    if (isHorizontalSwipe) {
      const isLeftSwipe = xDistance > minSwipeDistance;
      const isRightSwipe = xDistance < -minSwipeDistance;

      if (isLeftSwipe) {
        goToNext();
      } else if (isRightSwipe) {
        goToPrev();
      }
    } else {
      // Swipe Up (start.y > end.y means finger moved up)
      const isSwipeUp = yDistance > minSwipeDistance;

      if (isSwipeUp) {
        onOpenChange(false);
      }
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
          schoolSlug,
          classId,
          photoId: photo.id,
          photoUrl: displayUrl,
          photoAlt: photo.fileName || photo.alt,
          format: fmt as PhotoFormat,
          quantity: qty,
          pricePerUnit: getPrice(fmt as PhotoFormat, schoolPricing),
        });
      }
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 10000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-none !w-screen !h-[100dvh] !p-0 !gap-0 !border-0 !rounded-none overflow-hidden bg-black flex flex-col"
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
          {/* Photo with Overlay */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={getDisplayUrl(photo)}
              alt={photo.alt || t('photo')}
              className="max-w-full max-h-full object-contain select-none"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
            {/* Guard layer to prevent saving/copying */}
            <div
              className="absolute inset-0 z-10"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>

          {/* Top Bar - Back & Close Buttons */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 pt-[calc(2rem+env(safe-area-inset-top))] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <Button
              size="sm"
              className="pointer-events-auto !bg-slate-900 hover:!bg-slate-800 text-white gap-2 rounded-full shadow-lg border-0 font-bold text-base h-12 px-6"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="w-6 h-6" />
              <span>{t('back')}</span>
            </Button>

            <div className="pointer-events-none flex flex-col items-center">
              <span className="text-white font-mono font-bold text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                {photo.fileName ? photo.fileName.replace(/\.[^/.]+$/, "") : `#${String(currentIndex + 1).padStart(2, '0')}`}
              </span>
            </div>

            <Button
              size="icon"
              className="pointer-events-auto !bg-slate-900 hover:!bg-slate-800 !text-white rounded-full shadow-lg h-12 w-12"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-6 h-6" />
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
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {/* Format Selection */}
            <div className="flex flex-row gap-2 sm:gap-3 justify-center max-w-2xl mx-auto w-full">
              {Object.values(PhotoFormat).map((fmt) => {
                const qty = quantities[fmt] || 0;
                const itemPrice = getPrice(fmt, schoolPricing);
                const isSelected = qty > 0;

                return (
                  <div
                    key={fmt}
                    className={cn(
                      "flex items-center justify-between p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-md sm:shadow-lg backdrop-blur-md border-[1.5px] sm:border-2 border-black flex-1 min-w-0",
                      isSelected
                        ? "bg-green-100"
                        : "bg-white/90"
                    )}
                  >
                    <div className="flex flex-col mr-1 sm:mr-3 min-w-0">
                      <span className="font-extrabold text-[11px] sm:text-lg text-black leading-tight truncate">
                        {FORMAT_LABELS[fmt]}
                      </span>
                      <span className="text-[10px] sm:text-base font-bold text-black/80 truncate">
                        {formatPrice(itemPrice)}
                      </span>
                    </div>

                    <div className="flex items-center rounded-lg sm:rounded-xl shadow-sm bg-black/5 border border-black/10 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-10 sm:w-10 rounded-l-lg sm:rounded-l-xl hover:bg-black/10 text-black px-0 shrink-0"
                        onClick={() => updateQuantity(fmt, -1)}
                        disabled={qty <= 0}
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <span className="w-5 sm:w-10 text-center font-extrabold text-xs sm:text-lg text-black">
                        {qty}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-10 sm:w-10 rounded-r-lg sm:rounded-r-xl hover:bg-black/10 text-black px-0 shrink-0"
                        onClick={() => updateQuantity(fmt, 1)}
                        disabled={qty >= 99}
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions: Add to Cart & View Cart */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto w-full">
              <Button
                onClick={handleAddToCart}
                disabled={totalItemsCount === 0 || showSuccess}
                className={cn(
                  "h-14 sm:h-16 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-2xl transition-all backdrop-blur-sm text-white px-2 sm:px-4",
                  showSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700",
                  totalItemsCount === 0 && "opacity-50"
                )}
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 mr-1 shrink-0" />
                    <span className="text-[11px] sm:text-lg whitespace-normal leading-tight">{t('added_to_cart')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-6 sm:h-6 mr-1 shrink-0" />
                    <span className="font-extrabold text-[11px] sm:text-lg whitespace-normal leading-tight">{t('add_to_cart')}</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => setCartOpen(true)}
                className="h-14 sm:h-16 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-2xl transition-all backdrop-blur-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4"
              >
                <div className="flex flex-col items-start leading-tight min-w-0">
                  <span className="text-[10px] uppercase tracking-wider opacity-70 truncate w-full text-left">Корзина</span>
                  <span className="font-extrabold text-[11px] sm:text-lg truncate w-full text-left">{formatPrice(totalCartPrice)}</span>
                </div>
                <div className="relative shrink-0">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cartItems.filter(i => i.classId === classId).length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                      {cartItems.filter(i => i.classId === classId).length}
                    </span>
                  )}
                </div>
              </Button>
            </div>

            {/* Cart Drawer Instance inside Modal */}
            <CartDrawer
              open={cartOpen}
              onOpenChange={setCartOpen}
              classId={classId}
              schoolSlug={schoolSlug}
              schoolPricing={schoolPricing}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}