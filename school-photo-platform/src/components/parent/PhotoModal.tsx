'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/stores/language-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { SchoolPricing } from '@/config/pricing';
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

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const currentIndex = useMemo(() => {
    if (!photo) return -1;
    return allPhotos.findIndex(p => p.id === photo.id);
  }, [allPhotos, photo]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const displayUrl = getWatermarkUrl(photo.watermarkedUrl);

  const getDisplayUrl = (p: Photo) => {
    return p.watermarkedUrl;
  };

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

        </div>
      </DialogContent>
    </Dialog>
  );
}