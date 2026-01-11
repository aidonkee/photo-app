'use client';

import React, { useState } from 'react';
import PhotoModal from './PhotoModal';
import { Image as ImageIcon, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SchoolPricing } from '@/config/pricing';

type Photo = {
  id: string;
  watermarkedUrl: string;
  thumbnailUrl: string | null;
  alt: string | null;
  width: number;
  height: number;
};

type PhotoGalleryProps = {
  photos: Photo[];
  schoolPricing?: SchoolPricing | null;
};

export default function PhotoGallery({ photos, schoolPricing }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Фотографии отсутствуют
        </h3>
        <p className="text-sm text-slate-500">
          Фотограф скоро загрузит снимки класса.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* === MASONRY LAYOUT === */}
      {/* Используем columns-X вместо grid-cols-X для "тетрис" раскладки без дыр */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-12">
        {photos.map((photo, index) => {
          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="break-inside-avoid relative group cursor-zoom-in rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:shadow-lg transition-all duration-300"
            >
              {/* Фото полностью, без обрезки */}
              <img
                src={photo.thumbnailUrl || photo.watermarkedUrl}
                alt={photo.alt || `Фото ${index + 1}`}
                className="w-full h-auto object-contain block transform group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />

              {/* Затемнение при наведении */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Бейдж "Просмотр" по центру */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <Badge className="bg-white/90 text-slate-900 hover:bg-white gap-2 px-3 py-1.5 shadow-lg backdrop-blur-sm pointer-events-none">
                    <Maximize2 className="w-4 h-4" />
                    Смотреть
                 </Badge>
              </div>

              {/* Номер фото (всегда виден) */}
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm z-10">
                #{String(index + 1).padStart(2, '0')}
              </div>

              {/* Инфо внизу при наведении */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <p className="text-xs text-white font-medium truncate">
                    {photo.alt || 'Школьное фото'}
                 </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Modal (Lightbox) */}
      {selectedPhoto && (
        <PhotoModal
          open={!!selectedPhoto}
          onOpenChange={(open) => !open && setSelectedPhoto(null)}
          photo={selectedPhoto}
          schoolPricing={schoolPricing}
        />
      )}
    </>
  );
}