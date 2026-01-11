'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Maximize2, Image as ImageIcon } from 'lucide-react';

type Photo = {
  id: string;
  watermarkedUrl: string;
  alt: string | null;
  width: number;
  height: number;
};

type ClassroomGalleryProps = {
  photos: Photo[];
};

export default function ClassroomGallery({ photos }: ClassroomGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Фотографии ещё не загружены
        </h3>
        <p className="text-slate-600">
          Фотографии появятся здесь, как только фотограф их загрузит
        </p>
      </div>
    );
  }

  return (
    <>
      {/* MASONRY LAYOUT (Pinterest style) */}
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid relative group rounded-lg overflow-hidden cursor-zoom-in bg-slate-100 border border-slate-200"
            onClick={() => setSelectedPhoto(photo)}
          >
            {/* Изображение рендерится полностью, без обрезки */}
            <img
              src={photo.watermarkedUrl}
              alt={photo.alt || 'Фотография'}
              className="w-full h-auto object-contain block hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {/* Затемнение при наведении */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Бейдж "Просмотр" по центру */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Badge className="bg-white/90 text-slate-900 hover:bg-white gap-2 px-3 py-1.5 shadow-lg backdrop-blur-sm">
                <Maximize2 className="w-4 h-4" />
                Смотреть
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* МОДАЛКА ПРОСМОТРА (LIGHTBOX) */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-[90vw] h-[90vh] p-0 bg-transparent border-none shadow-none flex flex-col items-center justify-center outline-none">
          
          {/* Кнопка закрытия (справа сверху) */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
             {/* Кнопка Скачать (опционально, если хочешь разрешить учителю скачивать превью) */}
             {selectedPhoto && (
                <a 
                  href={selectedPhoto.watermarkedUrl} 
                  download 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all"
                >
                  <Download className="w-6 h-6" />
                </a>
             )}
             
            <button
              onClick={() => setSelectedPhoto(null)}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Само фото в модалке */}
          {selectedPhoto && (
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none"> 
              {/* pointer-events-none на контейнере, чтобы клик мимо фото закрывал (это дефолт Dialog), 
                  но само фото должно быть visible */}
              <img
                src={selectedPhoto.watermarkedUrl}
                alt={selectedPhoto.alt || 'Просмотр'}
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl pointer-events-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}