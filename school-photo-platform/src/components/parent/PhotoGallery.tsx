// src/components/parent/PhotoGallery.tsx
'use client';

import React, { useState } from 'react';
import PhotoModal from './PhotoModal';
import { Image as ImageIcon } from 'lucide-react';
import { SchoolPricing } from '@/config/pricing';

type Photo = {
  id: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl: string | null;
  alt: string | null;
  width: number;
  height: number;
};

type PhotoGalleryProps = {
  photos: Photo[];
  photoColumns?:  Photo[][]; // ✅ Распределённые по колонкам фотки
  photoIndexMap?:  Record<string, number>; // ✅ Карта индексов для нумерации
  schoolPricing?: SchoolPricing | null;
};

export default function PhotoGallery({ 
  photos, 
  photoColumns, 
  photoIndexMap,
  schoolPricing 
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const getDisplayUrl = (photo: Photo) => {
    return photo.watermarkedUrl;
  };

  // Получаем номер фото (оригинальный индекс + 1)
  const getPhotoNumber = (photoId: string, fallbackIndex: number): number => {
    if (photoIndexMap && photoIndexMap[photoId] !== undefined) {
      return photoIndexMap[photoId] + 1;
    }
    return fallbackIndex + 1;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Фотографии отсутствую��</h3>
        <p className="text-sm text-slate-500">Фотограф еще не загрузил снимки. </p>
      </div>
    );
  }

  // ✅ Если есть photoColumns — рендерим masonry по колонкам (как Wfolio)
  if (photoColumns && photoColumns.length > 0) {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
          {photoColumns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {column.map((photo) => {
                const photoNumber = getPhotoNumber(photo. id, 0);
                
                return (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="block w-full relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-slate-100 transition-all duration-300 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <img
                      src={getDisplayUrl(photo)}
                      alt={photo.alt || 'Фотография'}
                      className="w-full h-auto object-contain block"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono font-bold shadow-sm z-10">
                      #{String(photoNumber).padStart(2, '0')}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {selectedPhoto && (
          <PhotoModal
            open={!!selectedPhoto}
            onOpenChange={(open) => !open && setSelectedPhoto(null)}
            photo={selectedPhoto}
            allPhotos={photos}
            schoolPricing={schoolPricing}
            onPhotoChange={(photo:  Photo) => setSelectedPhoto(photo)}
          />
        )}
      </>
    );
  }

  // Fallback:  старый вариант с CSS columns (если photoColumns не переданы)
  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-12">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="block w-full break-inside-avoid relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-slate-100 transition-all duration-300 focus:ring-2 focus: ring-slate-900 focus: outline-none"
          >
            <img
              src={getDisplayUrl(photo)}
              alt={photo.alt || 'Фотография'}
              className="w-full h-auto object-contain block"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono font-bold shadow-sm z-10">
              #{String(index + 1).padStart(2, '0')}
            </div>
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoModal
          open={!! selectedPhoto}
          onOpenChange={(open) => !open && setSelectedPhoto(null)}
          photo={selectedPhoto}
          allPhotos={photos}
          schoolPricing={schoolPricing}
          onPhotoChange={(photo: Photo) => setSelectedPhoto(photo)}
        />
      )}
    </>
  );
}