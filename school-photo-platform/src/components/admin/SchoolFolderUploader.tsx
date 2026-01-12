'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FolderUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadSchoolPhotoAction } from '@/actions/admin/photo-actions';
import { Progress } from '@/components/ui/progress';

export default function SchoolFolderUploader({ schoolId }: { schoolId: string }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция для повторных попыток (Retry Mechanism)
  const uploadWithRetry = async (className: string, file: File, retries = 3): Promise<any> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await uploadSchoolPhotoAction(schoolId, className, formData);
        
        if (result?.error) throw new Error(result.error);
        
        return result; // Успешно загружено
      } catch (err: any) {
        if (attempt === retries) throw err; // Если это была последняя попытка, пробрасываем ошибку
        console.warn(`Попытка ${attempt} не удалась для ${file.name}. Пробуем снова...`);
        // Пауза перед следующей попыткой (1 секунда)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 1. Фильтрация: берем только изображения и игнорируем системные файлы (типа .DS_Store)
    const validFiles = files.filter(f => 
      f.type.startsWith('image/') && !f.name.startsWith('.')
    );

    if (validFiles.length === 0) {
      alert('В выбранной папке не найдено подходящих изображений.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorLog([]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      // Определяем класс по имени папки
      const pathParts = file.webkitRelativePath.split('/');
      // Путь обычно: НазваниеПапкиШколы/НазваниеКласса/фото.jpg
      const className = pathParts.length > 2 ? pathParts[pathParts.length - 2] : 'Общие';

      setStatus({ current: i + 1, total: validFiles.length, fileName: file.name });

      try {
        // Загружаем с механизмом повтора
        await uploadWithRetry(className, file);
      } catch (err: any) {
        console.error(`Критическая ошибка загрузки ${file.name}:`, err);
        setErrorLog(prev => [...prev, `${file.name}: ${err.message || 'Ошибка сервера'}`]);
      }

      // Обновляем прогресс-бар
      const currentProgress = Math.round(((i + 1) / validFiles.length) * 100);
      setProgress(currentProgress);
    }

    setUploading(false);

    if (errorLog.length > 0) {
      alert(`Загрузка завершена с ошибками (${errorLog.length} файлов не загружено). Проверьте консоль.`);
    } else {
      window.location.reload(); // Перезагружаем, чтобы увидеть результат
    }
  };

  return (
    <div className="inline-block">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        /* @ts-ignore - атрибуты для выбора папок в Chrome/Safari/Edge */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
      />
      
      <Button 
        onClick={() => {
          if (confirm('Убедитесь, что внутри папки школы находятся папки с названиями классов (например: "1А", "2Б"). Начать загрузку?')) {
            fileInputRef.current?.click();
          }
        }} 
        disabled={uploading}
        className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FolderUp className="w-4 h-4" />
        )}
        {uploading ? `Загрузка... ${status?.current}/${status?.total}` : 'Загрузить папку школы'}
      </Button>

      {uploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border shadow-2xl rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 leading-none">Загрузка архива</h3>
                <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {progress}%
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Файл: {status?.fileName}
              </p>
            </div>

            <div className="space-y-3">
              <Progress value={progress} className="h-2 bg-slate-100" />
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <span>Обработано: {status?.current}</span>
                <span>Всего: {status?.total}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <strong>Важно:</strong> Не закрывайте вкладку и не выключайте компьютер до завершения процесса. Каждое фото проходит обработку и наложение ватермарки.
              </p>
            </div>
            
            {errorLog.length > 0 && (
              <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded max-h-20 overflow-y-auto">
                Ошибок: {errorLog.length}. Некоторые файлы будут пропущены.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}