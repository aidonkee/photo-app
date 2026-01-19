'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0, name: '' });
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ fileName: string; error: string }>;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setUploadComplete(false);
    setUploadResult(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadComplete(false);
    let successCount = 0;
    let failedCount = 0;
    const uploadErrors: Array<{ fileName: string; error: string }> = [];

    setProgress({ current: 0, total: files.length, percent: 0, name: '' });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(prev => ({ ...prev, current: i + 1, name: file.name }));

      const formData = new FormData();
      // Очищаем имя от спецсимволов, чтобы не ломать заголовки
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      formData.append('file', file, safeName);
      formData.append('classId', classId);
      formData.append('schoolId', schoolId);

      try {
        // Добавляем timestamp, чтобы обойти кэш роутов Next.js
        const response = await fetch(`/api/upload-photos`, {
          method: 'POST',
          body: formData,
          // ВАЖНО: headers НЕ добавляем, браузер сам поставит boundary
        });

        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (e) {
          // Если сервер вернул HTML ошибку 500
          throw new Error(`Ответ сервера не JSON. Возможно, сбой API.`);
        }

        if (!response.ok) {
          throw new Error(data.error || `Ошибка ${response.status}`);
        }

        successCount++;
      } catch (error: any) {
        console.error(`Ошибка файла ${file.name}:`, error);
        failedCount++;
        uploadErrors.push({ fileName: file.name, error: error.message });
      }

      setProgress(prev => ({ 
        ...prev, 
        percent: Math.round(((i + 1) / files.length) * 100) 
      }));
    }

    setUploadResult({ success: successCount, failed: failedCount, errors: uploadErrors });
    setUploadComplete(true);
    setIsUploading(false);
    setFiles([]);

    if (successCount > 0) {
      setTimeout(() => window.location.reload(), 3000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    disabled: isUploading,
    maxSize: 50 * 1024 * 1024,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${['B', 'KB', 'MB', 'GB'][i]}`;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-slate-100 rounded-full">
            <UploadCloud className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-lg font-medium text-slate-700">
            {isDragActive ? 'Отпустите файлы' : 'Перетащите фото сюда'}
          </p>
        </div>
      </div>

      {files.length > 0 && !isUploading && !uploadComplete && (
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium text-slate-900">Выбрано: {files.length}</p>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>Очистить</Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {files.slice(0, 5).map((f, i) => (
              <div key={i} className="flex justify-between p-2 bg-slate-50 rounded text-sm">
                <span className="truncate flex-1">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-slate-400 ml-2"><X className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
          <Button onClick={handleUpload} className="w-full bg-slate-900 text-white">
            Загрузить все фото
          </Button>
        </Card>
      )}

      {isUploading && (
        <Card className="p-6 border-slate-200 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-900" />
          <Progress value={progress.percent} className="h-2 mb-4" />
          <p className="text-sm font-medium">Загрузка {progress.current} из {progress.total}</p>
          <p className="text-xs text-slate-500 truncate mt-1">{progress.name}</p>
        </Card>
      )}

      {uploadComplete && uploadResult && (
        <div className="space-y-3">
          <Alert className={uploadResult.failed === 0 ? 'bg-green-50' : 'bg-red-50'}>
            {uploadResult.failed === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              Загрузка завершена. Успешно: {uploadResult.success}, Ошибок: {uploadResult.failed}
            </AlertDescription>
          </Alert>
          {uploadResult.errors.length > 0 && (
            <div className="p-4 bg-slate-100 rounded text-xs space-y-1">
              {uploadResult.errors.map((e, i) => (
                <p key={i} className="text-red-600"><b>{e.fileName}:</b> {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}