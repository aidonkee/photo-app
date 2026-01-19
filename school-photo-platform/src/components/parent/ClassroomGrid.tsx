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
  photos:  Photo[];
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

// ИСПРАВЛЕННАЯ функция пересортировки для CSS columns
// CSS columns заполняет СВЕРХУ ВНИЗ по колонкам:  1,2,3 | 4,5,6 | 7,8,9
// Нам нужно чтобы визуально было СЛЕВА НАПРАВО: 1,2,3 | 4,5,6 | 7,8,9
// Поэтому мы переставляем элементы так, чтобы при колоночном заполн��нии
// они визуально расположились по горизонтали
function reorderForMasonry<T>(items: T[], columnCount: number): { item: T; originalIndex: number }[] {
  if (items.length === 0) return [];
  
  // Количество элементов в каждой колонке (колонки могут быть неравномерными)
  const totalItems = items.length;
  const baseItemsPerColumn = Math.floor(totalItems / columnCount);
  const extraItems = totalItems % columnCount;
  
  // Вычисляем сколько элементов в каждой колонке
  // Первые extraItems колонок получают на 1 элемент больше
  const columnHeights:  number[] = [];
  for (let col = 0; col < columnCount; col++) {
    columnHeights. push(baseItemsPerColumn + (col < extraItems ? 1 : 0));
  }
  
  // Создаём массив позиций:  для каждого оригинального индекса определяем
  // куда его нужно поставить, чтобы при колоночном заполнении он оказался на нужном месте
  const result: { item: T; originalIndex: number }[] = new Array(totalItems);
  
  let targetPosition = 0;
  
  // Идём по рядам (визуальным горизонтальным линиям)
  const maxRows = Math.max(...columnHeights);
  
  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < columnCount; col++) {
      // Проверяем, есть ли элемент в этой поз��ции (колонка может быть короче)
      if (row < columnHeights[col]) {
        // Вычисляем позицию в результирующем массиве для этой колонки и ряда
        // (сумма высот предыдущих колонок + текущий ряд)
        let positionInResult = 0;
        for (let c = 0; c < col; c++) {
          positionInResult += columnHeights[c];
        }
        positionInResult += row;
        
        // Оригинальный индекс - это просто порядковый номер (слева направо, сверху вниз)
        const originalIndex = targetPosition;
        
        if (originalIndex < totalItems) {
          result[positionInResult] = { item: items[originalIndex], originalIndex };
        }
        targetPosition++;
      }
    }
  }
  
  return result. filter(Boolean); // Убираем возможные undefined
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
          const aspectRatio = photo.width / photo. height;

          return (
            <div
              key={photo. id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative rounded-lg overflow-hidden cursor-pointer border-2 border-slate-200 hover: border-slate-400 transition-all hover:shadow-lg bg-slate-100 break-inside-avoid mb-4"
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