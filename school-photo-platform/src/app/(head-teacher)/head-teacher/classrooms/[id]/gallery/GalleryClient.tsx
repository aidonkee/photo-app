'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type PhotoData = {
    id: string;
    originalUrl: string;
    watermarkedUrl: string;
    thumbnailUrl?: string | null;
    fileName?: string | null;
};

export default function GalleryClient({ photos }: { photos: PhotoData[] }) {
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);

    if (photos.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900">Нет загруженных фотографий</h3>
                <p className="mt-1 text-slate-500 max-w-sm">
                    В этом классе пока нет ни одной фотографии. Фотограф должен загрузить их в панель управления классом.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <Image
                            src={photo.thumbnailUrl || photo.watermarkedUrl || photo.originalUrl}
                            alt={photo.fileName || "Photo"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-xs text-white truncate font-medium">
                                {photo.fileName || "Без имени"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
                    {selectedPhoto && (
                        <div className="relative w-[90vw] h-[85vh] max-w-4xl flex flex-col bg-white rounded-lg overflow-hidden shadow-2xl">
                            <div className="flex-1 relative bg-slate-100 flex items-center justify-center p-4">
                                {/* Use next/image for optimized viewing or standard img if original is required */}
                                <img
                                    src={selectedPhoto.watermarkedUrl || selectedPhoto.originalUrl}
                                    alt={selectedPhoto.fileName || "View Photo"}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                            {selectedPhoto.fileName && (
                                <div className="p-4 bg-white border-t border-slate-200">
                                    <p className="font-medium text-slate-900 truncate">{selectedPhoto.fileName}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
