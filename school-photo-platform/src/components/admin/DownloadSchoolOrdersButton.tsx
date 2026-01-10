'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';

type DownloadSchoolOrdersButtonProps = {
  schoolId: string;
  totalOrders: number;
};

export default function DownloadSchoolOrdersButton({ 
  schoolId, 
  totalOrders 
}: DownloadSchoolOrdersButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDownload = async () => {
    if (totalOrders === 0) {
      toast.error('Нет заказов для скачивания');
      return;
    }

    setIsDownloading(true);
    setIsSuccess(false);

    try {
      const response = await fetch('/api/download-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:  JSON.stringify({ schoolId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка скачивания');
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school-orders-${schoolId.slice(0, 8)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsSuccess(true);
      toast.success(`Скачано ${totalOrders} заказов`);

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
      disabled={isDownloading || totalOrders === 0}
      className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
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
          <PackageOpen className="w-4 h-4" />
          Скачать все заказы ({totalOrders})
        </>
      )}
    </Button>
  );
}