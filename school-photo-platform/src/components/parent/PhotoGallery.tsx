'use client';

import React, { useState } from 'react';
import WatermarkedImage from '@/components/shared/WatermarkedImage';
import PhotoModal from './PhotoModal';
import { Image as ImageIcon, Maximize2 } from 'lucide-react';

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
};

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex p-4 bg-slate-100 rounded-lg border border-slate-200 mb-4">
          <ImageIcon className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No Photos Available
        </h3>
        <p className="text-sm text-slate-500">
          Photos will be uploaded soon. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Wfolio-style grid:  masonry-like with varied aspect ratios */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {photos.map((photo, index) => {
          // Calculate aspect ratio for Wfolio-style varied heights
          const aspectRatio = photo.width / photo.height;
          const isWide = aspectRatio > 1.3;
          const isTall = aspectRatio < 0.8;

          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className={`group relative overflow-hidden cursor-pointer bg-slate-100 border border-slate-200 hover:border-slate-900 transition-all duration-200 rounded-md
                ${isWide ? 'md:col-span-2 aspect-[16/9]' : isTall ? 'md:row-span-2 aspect-[3/4]' : 'aspect-square'}
              `}
            >
              <WatermarkedImage
                src={photo.thumbnailUrl || photo.watermarkedUrl}
                alt={photo. alt}
                className="w-full h-full object-cover"
              />

              {/* Minimal hover overlay - Wfolio style */}
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-100 scale-95">
                  <div className="bg-white rounded-md p-2 shadow-sm">
                    <Maximize2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
              </div>

              {/* Photo Number Badge - top-left, minimal */}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-slate-200">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Bottom info bar - appears on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[11px] text-slate-700 font-medium truncate">
                  {photo.alt || `Photo ${index + 1}`}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {photo.width} × {photo.height}
                </p>
              </div>
            </div>
          );
        })}
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