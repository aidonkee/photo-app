'use client';

import React, { useState, useTransition } from 'react';
import { deletePhotosAction } from '@/actions/admin/photo-actions';
import DeletePhotoButton from './DeletePhotoButton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Square,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type Photo = {
  id: string;
  watermarkedUrl: string;
  alt: string | null;
  width?:  number;
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
    errors:  string[];
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
        newSet. add(photoId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(photos. map((p) => p.id)));
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
      } catch (error:  any) {
        alert(error.message || 'Ошибка при удалении фотографий');
      }
    });
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex p-4 bg-slate-100 rounded-lg border border-slate-200 mb-4">
          <img
            src="/placeholder-image.svg"
            alt="No photos"
            className="w-12 h-12 text-slate-300"
          />
        </div>
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
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          {! selectionMode ? (
            <Button
              onClick={toggleSelectionMode}
              variant="outline"
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Выбрать фото
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleSelectionMode}
                variant="outline"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Отменить
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              {selectedIds.size === photos.length ? (
                <Button onClick={deselectAll} variant="ghost" size="sm">
                  Снять выделение
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
            <span className="text-sm text-slate-600">
              Выбрано: <strong>{selectedIds.size}</strong> из {photos.length}
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
              Удалить выбранные
            </Button>
          </div>
        )}
      </div>

      {/* Result Message */}
      {result && (
        <Alert
          variant={result.errors.length > 0 ? 'destructive' : 'default'}
          className={
            result.errors.length === 0
              ? 'bg-slate-50 border-slate-200'
              : ''
          }
        >
          {result.errors.length === 0 ? (
            <CheckCircle2 className="h-4 w-4 text-slate-900" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription
            className={result.errors.length === 0 ? 'text-slate-700' : ''}
          >
            <p className="font-semibold mb-1">Операция завершена</p>
            <p>
              Удалено: <strong>{result.deleted}</strong>
              {result.skipped > 0 && (
                <> • Пропущено (в заказах): <strong>{result.skipped}</strong></>
              )}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ GRID с фиксированной высотой */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos. map((photo) => {
          const isSelected = selectedIds.has(photo.id);

          return (
            <div
              key={photo.id}
              className={`group relative bg-slate-100 rounded-md border-2 transition-all overflow-hidden h-64 ${
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-400'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {/* ✅ object-contain — показывает всю фотку */}
              <img
                src={photo.watermarkedUrl}
                alt={photo.alt || 'Фотография'}
                className="w-full h-full object-contain"
                loading="lazy"
              />

              {/* Selection Mode:  Checkbox Overlay */}
              {selectionMode && (
                <div
                  onClick={() => togglePhoto(photo.id)}
                  className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-all cursor-pointer flex items-center justify-center"
                >
                  <div
                    className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-white/90 border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
              )}

              {/* Normal Mode: Delete Button on Hover */}
              {! selectionMode && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <DeletePhotoButton photoId={photo.id} />
                </div>
              )}

              {/* Photo Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none">
                <p className="text-xs text-white truncate font-medium">
                  {photo.alt || 'Без названия'}
                </p>
              </div>

              {/* Selection Badge */}
              {selectionMode && isSelected && (
                <div className="absolute top-2 right-2 bg-slate-900 text-white px-2 py-1 rounded-full text-xs font-bold">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить{' '}
              <strong>{selectedIds.size}</strong>{' '}
              {selectedIds.size === 1
                ? 'фотографию'
                : selectedIds.size < 5
                ? 'фотографии'
                : 'фотографий'}
              ?
              <br />
              <br />
              <span className="text-amber-600">
                Фотографии, которые уже есть в заказах, будут пропущены.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Удаление...
                </span>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}