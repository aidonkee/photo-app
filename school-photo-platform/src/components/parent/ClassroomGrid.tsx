'use client';
import React, { useState } from 'react';
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
      {/* ✅ Grid с горизонтальной нумерацией и сохранением пропорций */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ 
          gridAutoFlow: 'row',  // ✅ Заполнение по строкам (слева направо)
          alignItems: 'start'    // ✅ Карточки не растягиваются по высоте
        }}
      >
        {photos.map((photo, index) => {
          const aspectRatio = photo.width / photo.height;
          
          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative rounded-lg overflow-hidden cursor-pointer border-2 border-slate-200 hover:border-slate-400 transition-all hover:shadow-lg bg-slate-100 w-full"
              style={{ aspectRatio }} // ✅ Сохраняем оригинальные пропорции
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