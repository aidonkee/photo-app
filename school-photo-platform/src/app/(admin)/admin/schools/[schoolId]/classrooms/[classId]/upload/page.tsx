'use client';

import React, { use } from 'react';
import Link from 'next/link';
import PhotoUploader from '@/components/admin/PhotoUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload } from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolId: string;
    classId: string;
  }>;
};

export default function UploadPage({ params }: PageProps) {
  const { schoolId, classId } = use(params);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <div className="border-b border-slate-200 pb-4">
        <Link href={`/admin/schools/${schoolId}/classrooms/${classId}`}>
          <Button variant="ghost" className="gap-2 mb-4 -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Назад к классу
          </Button>
        </Link>

        <div className="flex items-center gap-3 mt-2">
          <div className="p-2.5 bg-slate-900 rounded-md">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Загрузка фотографий
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Добавьте фотографии в этот класс
            </p>
          </div>
        </div>
      </div>

      <Card className="border border-dashed border-slate-200 bg-white">
        <CardContent className="pt-3 pb-3 px-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Массовая загрузка фотографий
            </h3>
            <p className="text-sm text-slate-500">
              Выберите несколько фотографий или перетащите их в зону загрузки
            </p>
          </div>
        </CardContent>
      </Card>

      <PhotoUploader classId={classId} />
    </div>
  );
}