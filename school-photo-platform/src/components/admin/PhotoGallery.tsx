'use client';

import React, { useState, useTransition } from 'react';
import { deletePhotosAction } from '@/actions/admin/photo-actions';
import DeletePhotoButton from './DeletePhotoButton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckSquare,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

type Photo = {
  id: string;
  watermarkedUrl: string;
  alt: string | null;
  width?: number;
  height?: number;
};

type PhotoGalleryProps = {
  photos: Photo[];
  classId: string;
};

export default function PhotoGallery({ photos, classId }: PhotoGalleryProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    deleted: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const togglePhoto = (photoId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        const photoIds = Array.from(selectedIds);
        const deleteResult = await deletePhotosAction(classId, photoIds);

        setResult(deleteResult);
        setSelectedIds(new Set());
        setSelectionMode(false);
        setShowDeleteDialog(false);

        setTimeout(() => setResult(null), 5000);
      } catch (error: any) {
        alert(error.message || 'Ошибка при удалении фотографий');
      }
    });
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Фотографии ещё не загружены
        </h3>
        <p className="text-slate-600">
          Используйте загрузчик выше, чтобы добавить фотографии
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {!selectionMode ? (
            <Button
              onClick={toggleSelectionMode}
              variant="outline"
              className="gap-2 bg-white"
            >
              <CheckSquare className="w-4 h-4" />
              Выбрать фото
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleSelectionMode}
                variant="outline"
                className="gap-2 bg-white"
              >
                <X className="w-4 h-4" />
                Отменить
              </Button>
              <div className="h-6 w-px bg-slate-300 mx-2" />
              {selectedIds.size === photos.length ? (
                <Button onClick={deselectAll} variant="ghost" size="sm">
                  Снять все
                </Button>
              ) : (
                <Button onClick={selectAll} variant="ghost" size="sm">
                  Выбрать все
                </Button>
              )}
            </>
          )}
        </div>

        {selectionMode && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">
              Выбрано: <strong>{selectedIds.size}</strong>
            </span>
            <Button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || isPending}
              variant="destructive"
              className="gap-2"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Удалить ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Result Message */}
      {result && (
        <Alert
          variant={result.errors.length > 0 ? 'destructive' : 'default'}
          className={result.errors.length === 0 ? 'bg-green-50 border-green-200 text-green-800' : ''}
        >
          {result.errors.length === 0 ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <p className="font-semibold">Операция завершена</p>
            <p className="text-sm mt-1">
              Удалено: {result.deleted} • Пропущено (есть заказы): {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs list-disc list-inside text-red-600">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* === MASONRY LAYOUT (PINTEREST STYLE) === */}
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 pb-10">
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id);

          return (
            <div
              key={photo.id}
              className={`
                break-inside-avoid relative group rounded-lg overflow-hidden transition-all duration-300
                ${isSelected ? 'ring-4 ring-slate-900 shadow-xl opacity-90' : 'border border-slate-200 shadow-sm hover:shadow-md'}
              `}
            >
              {/* Фотография (Полная, без кропа) */}
              <img
                src={photo.watermarkedUrl}
                alt={photo.alt || 'Фотография'}
                className="w-full h-auto object-contain block bg-slate-100"
                loading="lazy"
              />

              {/* === РЕЖИМ ВЫБОРА === */}
              {selectionMode && (
                <div
                  onClick={() => togglePhoto(photo.id)}
                  className={`
                    absolute inset-0 cursor-pointer transition-colors flex items-center justify-center
                    ${isSelected ? 'bg-slate-900/40' : 'bg-black/0 hover:bg-black/10'}
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-lg
                      ${isSelected ? 'bg-slate-900 border-slate-900 scale-110' : 'bg-white border-slate-300 scale-100'}
                    `}
                  >
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                </div>
              )}

              {/* === ОБЫЧНЫЙ РЕЖИМ (Кнопка удаления) === */}
              {!selectionMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                   {/* Обертка для кнопки удаления из пропсов, чтобы она была поверх фото */}
                   <div className="bg-white/90 rounded-full shadow-sm backdrop-blur-sm">
                      <DeletePhotoButton photoId={photo.id} />
                   </div>
                </div>
              )}
              
              {/* Инфо (Номер фото / Имя) */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs text-white font-medium truncate">
                  {photo.alt || 'Без названия'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить фотографии?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить <strong>{selectedIds.size}</strong> фото.
              <br />
              Если на фотографии уже есть заказы от родителей, они <strong>НЕ будут удалены</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}