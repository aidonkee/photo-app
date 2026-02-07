import React from 'react';
import Link from 'next/link';
import { getClassroomById } from '@/actions/admin/classroom-actions';
import PhotoUploader from '@/components/admin/PhotoUploader';
import PhotoGallery from '@/components/admin/PhotoGallery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Image, Users } from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolId: string;
    classId: string;
  }>;
};

import DeleteButton from '@/components/admin/DeleteButton';
import { deleteClassroomAction } from '@/actions/admin/classroom-actions';

export default async function ClassroomPage({ params }: PageProps) {
  const { schoolId, classId } = await params;
  const classroom = await getClassroomById(classId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <Link href={`/admin/schools/${schoolId}`}>
          <Button variant="ghost" className="gap-2 mb-4 -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Назад к школе
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {classroom.name}
            </h1>
            <p className="text-sm text-slate-500">
              {classroom._count?.photos || 0} фотографий
            </p>
          </div>
          <div className="ml-auto">
            <DeleteButton
              id={classId}
              entityName="Класс"
              deleteAction={deleteClassroomAction}
              redirectUrl={`/admin/schools/${schoolId}`}
              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
            />
          </div>
        </div>
      </div>

      {/* Photo Uploader - теперь передаём schoolId */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Загрузить фотографии
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <PhotoUploader classId={classId} schoolId={schoolId} />
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">
            Фотографии класса
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <PhotoGallery photos={classroom.photos || []} classId={classId} />
        </CardContent>
      </Card>
    </div>
  );
}