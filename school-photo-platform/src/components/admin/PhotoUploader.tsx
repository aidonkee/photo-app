'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPhotoAction } from '@/actions/admin/photo-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, X, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// CRITICAL: Upload ONE file at a time to prevent server overload
const BATCH_SIZE = 1;

// Delay between uploads to prevent server throttling (in ms)
const UPLOAD_DELAY = 100;

type PhotoUploaderProps = {
  classId: string;
};

type UploadStats = {
  total: number;
  success: number;
  failed: number;
  current: string;
};

export default function PhotoUploader({ classId }: PhotoUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setStats(null);
    setFailedFiles([]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    disabled: uploading,
  });

  // Helper function to add delay between uploads
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setFailedFiles([]);
    
    let successCount = 0;
    let failedCount = 0;
    const failedFileNames: string[] = [];

    setStats({
      total: files.length,
      success: 0,
      failed: 0,
      current: '',
    });

    // Process files ONE BY ONE (sequential upload)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update current file being processed
      setStats(prev => prev ? { ...prev, current: file.name } : null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadPhotoAction(classId, formData);

        if (result.error) {
          console.error(`Upload failed for ${file.name}:`, result.error);
          failedCount++;
          failedFileNames.push(file.name);
        } else if (result.success && result.uploaded === 1) {
          successCount++;
        } else {
          failedCount++;
          failedFileNames.push(file.name);
        }
      } catch (err) {
        console.error(`Network error for ${file.name}:`, err);
        failedCount++;
        failedFileNames.push(file.name);
      }

      // Update progress
      const processedFiles = i + 1;
      const progressPercent = Math.round((processedFiles / files.length) * 100);
      setProgress(progressPercent);

      setStats({
        total: files.length,
        success: successCount,
        failed: failedCount,
        current: file.name,
      });

      if (i < files.length - 1) {
        await delay(UPLOAD_DELAY);
      }
    }

    setStats({
      total: files.length,
      success: successCount,
      failed: failedCount,
      current: '',
    });
    setFailedFiles(failedFileNames);
    setFiles([]); 
    setUploading(false);
    setProgress(100);

    if (successCount > 0) {
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-slate-50'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
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
              или нажмите, чтобы выбрать файлы (JPG, PNG, WebP)
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Макс. размер файла: 10MB • Поддерживается пакетная загрузка
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && !uploading && !stats && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium text-slate-700">
              Выбрано файлов: {files.length}
              <span className="text-sm text-slate-500 ml-2">
                {/* --- ИСПРАВЛЕНИЕ ЗДЕСЬ --- */}
                ({(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB)
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
              Очистить все
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {files.slice(0, 10).map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ImageIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-slate-400 hover:text-slate-500 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {files.length > 10 && (
              <p className="text-sm text-slate-500 text-center py-2">
                ... и еще {files.length - 10} файлов
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800"
            disabled={uploading}
          >
            Загрузить {files.length} фото
          </Button>
        </Card>
      )}

      {/* Upload Progress (остальной код без изменений) */}
      {uploading && stats && (
        <Card className="p-6 space-y-4">
          <div className="text-center">
            <p className="font-semibold text-slate-900 text-lg mb-2">
              Загрузка фотографий...
            </p>
            <p className="text-sm text-slate-600">
              Пожалуйста, не закрывайте эту страницу
            </p>
          </div>

          <Progress value={progress} className="h-3" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-600">Всего</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.success}</p>
              <p className="text-xs text-slate-600">Загружено</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600">{stats.failed}</p>
              <p className="text-xs text-slate-600">Ошибок</p>
            </div>
          </div>

          {stats.current && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-900 text-center truncate">
                Обработка: <span className="font-medium">{stats.current}</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Upload Results */}
      {!uploading && stats && stats.total > 0 && (
        <div className="space-y-3">
          <Alert 
            variant={stats.failed > 0 ? "destructive" : "default"} 
            className={stats.failed === 0 ? "bg-slate-50 border-slate-200" : ""}
          >
            {stats.failed === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-slate-900" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={stats.failed === 0 ? "text-slate-700" : ""}>
              <p className="font-semibold mb-1">Загрузка завершена</p>
              <p>
                Успешно загружено: <b>{stats.success}</b> из <b>{stats.total}</b>
                {stats.failed > 0 && (
                  <> • Ошибок: <b className="text-slate-600">{stats.failed}</b></>
                )}
              </p>
            </AlertDescription>
          </Alert>

          {failedFiles.length > 0 && (
            <Card className="p-4 bg-slate-50 border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Не удалось загрузить следующие файлы:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {failedFiles.map((fileName, idx) => (
                  <p key={idx} className="text-xs text-slate-700 truncate">
                    • {fileName}
                  </p>
                ))}
              </div>
            </Card>
          )}

          {stats.success > 0 && (
            <p className="text-center text-sm text-slate-600">
              Страница обновится автоматически через 3 секунды...
            </p>
          )}
        </div>
      )}
    </div>
  );
}