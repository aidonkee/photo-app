'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

type PhotoUploaderProps = {
  classId: string;
  schoolId: string;
};

export default function PhotoUploader({ classId, schoolId }: PhotoUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ fileName: string; error: string }>;
  } | null>(null);

  const { uploadFiles, isUploading, progress, errors } = useUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setUploadComplete(false);
    setUploadResult(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setUploadComplete(false);
    setUploadResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    disabled: isUploading,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    const result = await uploadFiles(files, classId, schoolId);

    setUploadResult({
      success: result.uploadedCount,
      failed: result. failedCount,
      errors:  result.errors,
    });

    setUploadComplete(true);
    setFiles([]);

    // Reload page after success
    if (result.uploadedCount > 0) {
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-slate-100 rounded-full">
            <UploadCloud className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isDragActive ? 'Отпустите файлы здесь' : 'Перетащите фото сюда'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              или нажмите для выбора (JPG, PNG, WebP)
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Макс. размер файла: 50MB • Загрузка напрямую в облако
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && ! isUploading && ! uploadComplete && (
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium text-slate-900">
              Выбрано:  {files.length} файлов
              <span className="text-sm text-slate-500 ml-2">
                ({formatFileSize(totalSize)})
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Очистить
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.slice(0, 10).map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ImageIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm truncate text-slate-700">{file.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatFileSize(file. size)}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-slate-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {files.length > 10 && (
              <p className="text-sm text-slate-500 text-center py-2">
                ...  и ещё {files.length - 10} файлов
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            За��рузить {files.length} фото
          </Button>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card className="p-6 border-slate-200">
          <div className="text-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900 mx-auto mb-2" />
            <p className="font-semibold text-slate-900">Загрузка фотографий...</p>
            <p className="text-sm text-slate-500">Не закрывайте страницу</p>
          </div>

          <Progress value={progress. overallProgress} className="h-2 mb-4" />

          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{progress.totalFiles}</p>
              <p className="text-xs text-slate-500">Всего</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {progress.uploadedPhotoIds.length}
              </p>
              <p className="text-xs text-slate-500">Загружено</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{progress.overallProgress}%</p>
              <p className="text-xs text-slate-500">Прогресс</p>
            </div>
          </div>

          {progress.currentFileName && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-700 truncate text-center">
                Обработка:  <span className="font-medium">{progress.currentFileName}</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Upload Results */}
      {uploadComplete && uploadResult && (
        <div className="space-y-3">
          <Alert
            variant={uploadResult.failed > 0 ? 'destructive' : 'default'}
            className={uploadResult.failed === 0 ? 'bg-slate-50 border-slate-200' : ''}
          >
            {uploadResult.failed === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-slate-900" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={uploadResult.failed === 0 ? 'text-slate-700' : ''}>
              <p className="font-semibold mb-1">Загрузка завершена</p>
              <p>
                Успешно: <b>{uploadResult.success}</b>
                {uploadResult.failed > 0 && (
                  <> • Ошибок: <b>{uploadResult.failed}</b></>
                )}
              </p>
            </AlertDescription>
          </Alert>

          {uploadResult.errors.length > 0 && (
            <Card className="p-4 bg-slate-50 border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Не удалось загрузить: 
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uploadResult.errors.map((err, idx) => (
                  <p key={idx} className="text-xs text-slate-600">
                    • {err. fileName}: {err.error}
                  </p>
                ))}
              </div>
            </Card>
          )}

          {uploadResult.success > 0 && (
            <p className="text-center text-sm text-slate-500">
              Страница обновится через 3 секунды... 
            </p>
          )}
        </div>
      )}
    </div>
  );
}