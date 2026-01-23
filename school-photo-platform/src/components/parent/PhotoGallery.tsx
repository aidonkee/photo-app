'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PhotoModal from './PhotoModal';
import { Image as ImageIcon } from 'lucide-react';
import { SchoolPricing } from '@/config/pricing';
import { useTranslation } from '@/stores/language-store';

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
  schoolPricing?: SchoolPricing | null;
};

function useColumnCount() {
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth < 768) {
        setColumnCount(2);
      } else if (window.innerWidth < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  return columnCount;
}

/**
 * Распределяет фотки по колонкам СТРОГО ПО РЯДАМ (слева направо).
 * Фото 0,1,2,3 -> первый ряд
 * Фото 4,5,6,7 -> второй ряд
 */
function distributeToColumns(
  photos: Photo[],
  columnCount: number
): { photo: Photo; originalIndex: number }[][] {
  const columns: { photo: Photo; originalIndex: number }[][] = Array.from(
    { length: columnCount },
    () => []
  );

  photos.forEach((photo, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push({ photo, originalIndex: index });
  });

  return columns;
}

export default function PhotoGallery({
  photos,
  schoolPricing,
}: PhotoGalleryProps) {
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const columnCount = useColumnCount();

  const columns = useMemo(
    () => distributeToColumns(photos, columnCount),
    [photos, columnCount]
  );

  const getDisplayUrl = (photo: Photo) => {
    return photo.watermarkedUrl;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('no_photos')}</h3>
        <p className="text-sm text-slate-500">{t('no_photos_yet')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 pb-12">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-4">
            {column.map(({ photo, originalIndex }) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="block w-full relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-slate-100 transition-all duration-300 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <img
                  src={getDisplayUrl(photo)}
                  alt={photo.alt || t('photo')}
                  className="w-full h-auto object-contain block"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono font-bold shadow-sm z-10">
                  #{String(originalIndex + 1).padStart(2, '0')}
                </div>
              </button>
            ))}
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
          onPhotoChange={(photo: Photo) => setSelectedPhoto(photo)}
        />
      )}
    </>
  );
}