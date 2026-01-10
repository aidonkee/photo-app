'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type DownloadOrderButtonProps = {
  orderId: string;
};

export default function DownloadOrderButton({ orderId }: DownloadOrderButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    setIsSuccess(false);

    try {
      const response = await fetch('/api/download-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:  JSON.stringify({ orderId }),
      });

      if (!response. ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка скачивания');
      }

      // Получаем blob из ответа
      const blob = await response.blob();

      // Создаём ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-${orderId.slice(0, 8)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Показываем успех
      setIsSuccess(true);
      toast.success('Архив успешно скачан');

      // Сбрасываем статус через 3 секунды
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);

    } catch (error:  any) {
      console.error('Ошибка скачивания:', error);
      toast.error(error.message || 'Не удалось скачать архив');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant="outline"
      className="gap-2 border-slate-300 text-slate-900 hover:bg-slate-50"
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Подготовка архива...
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Скачано
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Скачать оригиналы
        </>
      )}
    </Button>
  );
}