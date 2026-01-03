'use client';

import React, { useState } from 'react';
import PhotoModal from './PhotoModal';
import WatermarkedImage from '@/components/shared/WatermarkedImage';
import { Image as ImageIcon } from 'lucide-react';

type Photo = {
  id: string;
  watermarkedUrl: string;
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
        <ImageIcon className="w-24 h-24 text-slate-300 mx-auto mb-6" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-slate-200 hover:border-blue-400 transition-all hover:shadow-xl"
          >
            {/* Use WatermarkedImage component with proper error handling */}
            <WatermarkedImage
              src={photo.thumbnailUrl || photo.watermarkedUrl}
              alt={photo.alt}
              className="w-full h-full"
              fallbackClassName="w-full h-full bg-slate-100"
            />
            
            {/* Hover Overlay - FIX: use bg-black/0 to prevent black square */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-110 duration-300">
                <div className="bg-white rounded-full p-3 shadow-lg">
                  <ImageIcon className="w-6 h-6 text-slate-900" />
                </div>
              </div>
            </div>

            {/* Photo number badge */}
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
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          open={!! selectedPhoto}
          onOpenChange={(open) => !open && setSelectedPhoto(null)}
          photo={selectedPhoto}
        />
      )}
    </>
  );
}