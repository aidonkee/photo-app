'use client';

import React, { useState, useMemo } from 'react';
import PhotoModal from './PhotoModal';
import WatermarkedImage from '@/components/shared/WatermarkedImage';
import { Image as ImageIcon } from 'lucide-react';

type Photo = {
  id: string;
  watermarkedUrl: string;
  originalUrl: string;
  thumbnailUrl: string | null;
  alt: string | null;
  width: number;
  height: number;
};

type ClassroomGridProps = {
  photos: Photo[];
};

// Хук для определения количества колонок
function useColumnCount() {
  const [columns, setColumns] = useState(4);

  React.useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 640) setColumns(2);
      else if (window. innerWidth < 768) setColumns(3);
      else setColumns(4);
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}

// Функция для пересортировки:  из горизонтального порядка в колоночный
function reorderForMasonry<T>(items: T[], columnCount: number): { item: T; originalIndex: number }[] {
  if (items.length === 0) return [];
  
  const rowCount = Math.ceil(items.length / columnCount);
  const result: { item: T; originalIndex: number }[] = [];
  
  // Распределяем по колонкам так, чтобы индексы шли по горизонтали
  for (let col = 0; col < columnCount; col++) {
    for (let row = 0; row < rowCount; row++) {
      const originalIndex = row * columnCount + col;
      if (originalIndex < items.length) {
        result.push({ item: items[originalIndex], originalIndex });
      }
    }
  }
  
  return result;
}

export default function ClassroomGrid({ photos }: ClassroomGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const columnCount = useColumnCount();

  // Пересортированные фотки для masonry с сохранением оригинального индекса
  const reorderedPhotos = useMemo(
    () => reorderForMasonry(photos, columnCount),
    [photos, columnCount]
  );

  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex p-4 bg-slate-100 rounded-lg border border-slate-200 mb-6">
          <ImageIcon className="w-16 h-16 text-slate-400" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-3">
          Фотографии отсутствуют
        </h3>
        <p className="text-slate-600 text-lg">
          Фотографии будут загружены в ближайшее время. 
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry Grid с колонками */}
      <div className="columns-2 sm: columns-3 md:columns-4 gap-4 space-y-4">
        {reorderedPhotos.map(({ item:  photo, originalIndex }) => {
          // Вычисляем aspect ratio для сохранения пропорций
          const aspectRatio = photo. width / photo.height;

          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative rounded-lg overflow-hidden cursor-pointer border-2 border-slate-200 hover:border-slate-400 transition-all hover:shadow-lg bg-slate-100 break-inside-avoid"
              style={{ aspectRatio }}
            >
              <WatermarkedImage
                src={photo.thumbnailUrl || photo.watermarkedUrl}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="w-full h-full object-contain"
                fallbackClassName="w-full h-full bg-slate-100"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-110 duration-300">
                  <div className="bg-white rounded-full p-3 shadow-lg">
                    <ImageIcon className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
              </div>

              {/* Photo Number Badge — используем originalIndex для правильной нумерации */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                #{originalIndex + 1}
              </div>

              {/* Quick View Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover: opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium text-center">
                  Нажмите для просмотра
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          open={!!selectedPhoto}
          onOpenChange={(open) => !open && setSelectedPhoto(null)}
          photo={selectedPhoto}
        />
      )}
    </>
  );
}