'use client';
import React, { useState, useEffect, useRef } from 'react';
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

export default function ClassroomGrid({ photos }: ClassroomGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [columns, setColumns] = useState<Photo[][]>([[], [], [], []]);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Распределяем фотки по колонкам с учётом высоты (как в masonry, но горизонтально)
  useEffect(() => {
    const distributePhotos = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      let numColumns = 4; // По умолчанию 4 колонки
      
      if (containerWidth < 640) numColumns = 2; // Mobile
      else if (containerWidth < 768) numColumns = 3; // Tablet
      
      const newColumns: Photo[][] = Array.from({ length: numColumns }, () => []);
      const columnHeights = Array(numColumns).fill(0);
      
      // ✅ Раскладываем фотки слева направо, учитывая высоту каждой колонки
      photos.forEach((photo) => {
        // Находим самую короткую колонку
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        newColumns[shortestColumnIndex].push(photo);
        
        // Добавляем высоту фотки к колонке (с учётом aspect ratio)
        const aspectRatio = photo.width / photo.height;
        const photoHeight = 300 / aspectRatio; // Предполагаем ширину колонки ~300px
        columnHeights[shortestColumnIndex] += photoHeight + 16; // +16 для gap
      });
      
      setColumns(newColumns);
    };
    
    distributePhotos();
    
    // Пересчитываем при изменении размера окна
    window.addEventListener('resize', distributePhotos);
    return () => window.removeEventListener('resize', distributePhotos);
  }, [photos]);

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
      {/* ✅ Masonry с горизонтальной нумерацией */}
      <div 
        ref={containerRef}
        className="flex gap-4"
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-4">
            {column.map((photo) => {
              const index = photos.findIndex(p => p.id === photo.id);
              const aspectRatio = photo.width / photo.height;
              
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative rounded-lg overflow-hidden cursor-pointer border-2 border-slate-200 hover:border-slate-400 transition-all hover:shadow-lg bg-slate-100"
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

                  {/* Photo Number Badge */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                    #{index + 1}
                  </div>

                  {/* Quick View Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium text-center">
                      Нажмите для просмотра
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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