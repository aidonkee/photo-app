'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { exportOrdersToExcel } from '@/actions/admin/order-export-actions';
import { toast } from 'sonner';

type DownloadSchoolOrdersButtonProps = {
  schoolId: string;
  classId?: string; // Optional class filtering
  totalOrders: number;
  hideZip?: boolean; // Hide the ZIP download button
  excludedOrderIds?: string[];
};

export default function DownloadSchoolOrdersButton({
  schoolId,
  classId,
  totalOrders,
  hideZip = false,
  excludedOrderIds = []
}: DownloadSchoolOrdersButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
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
        body: JSON.stringify({ schoolId, classId, excludedOrderIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка скачивания');
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${(classId || schoolId).slice(0, 8)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsSuccess(true);
      toast.success(`Скачано ${totalOrders} заказов`);

      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Ошибка скачивания:', error);
      toast.error(error.message || 'Не удалось скачать архив');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportExcel = async () => {
    if (totalOrders === 0) {
      toast.error('Нет заказов для экспорта');
      return;
    }

    setIsExportingExcel(true);
    try {
      const data = await exportOrdersToExcel(schoolId, classId, excludedOrderIds);
      const isZip = !classId;
      const mimeType = isZip ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const extension = isZip ? 'zip' : 'xlsx';

      const blob = new Blob([new Uint8Array(data)], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-excel-${(classId || schoolId).slice(0, 8)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(isZip ? 'Архив с Excel-отчетами скачан' : 'Excel-отчет скачан');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка экспорта');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={handleExportExcel}
        disabled={isExportingExcel || totalOrders === 0}
        variant="outline"
        className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 h-10"
      >
        {isExportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        )}
        Excel отчет
      </Button>

      {!hideZip && (
        <Button
          onClick={handleDownload}
          disabled={isDownloading || totalOrders === 0}
          className="gap-2 bg-slate-900 text-white hover:bg-slate-800 h-10"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Подготовка...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Готово
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              ZIP архив ({totalOrders})
            </>
          )}
        </Button>
      )}
    </div>
  );
}