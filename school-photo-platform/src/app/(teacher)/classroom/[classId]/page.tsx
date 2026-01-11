import React from 'react';
import Link from 'next/link';
import { getClassroomPhotos, getTeacherDashboardData } from '@/actions/teacher/dashboard-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ClassroomGallery from '@/components/teacher/ClassroomGallery'; // Импорт нового компонента
import {
  Lock,
  Unlock,
  FileEdit,
  AlertCircle,
  Info,
} from 'lucide-react';

type PageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function ClassroomPhotosPage({ params }: PageProps) {
  await params; 
  const photos = await getClassroomPhotos();
  const data = await getTeacherDashboardData();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Фотографии класса {data.classroom.name}
          </h1>
          <p className="text-slate-600 mt-1">
            {photos.length} {photos.length === 1 ? 'фотография' : 'фотографий'} доступно
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/classroom/${data.classroom.id}/request-edit`}>
            <Button variant="outline" className="gap-2 bg-white">
              <FileEdit className="w-4 h-4" />
              Сообщить о проблеме
            </Button>
          </Link>
          
          {data.classroom.isLocked ? (
            <Badge variant="destructive" className="text-sm px-3 py-1.5 h-10">
              <Lock className="w-4 h-4 mr-2" />
              Заблокировано
            </Badge>
          ) : (
            <Badge className="bg-slate-900 text-sm px-3 py-1.5 h-10 hover:bg-slate-800">
              <Unlock className="w-4 h-4 mr-2" />
              Доступно для заказа
            </Badge>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200 text-blue-900">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Это предварительный просмотр. Водяные знаки будут удалены на финальных фотографиях.
        </AlertDescription>
      </Alert>

      {/* Status Warning */}
      {data.classroom.isLocked && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Этот класс отправлен в печать. Новые заказы временно недоступны.
          </AlertDescription>
        </Alert>
      )}

      {/* --- ГАЛЕРЕЯ (CLIENT COMPONENT) --- */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <ClassroomGallery photos={photos} />
      </div>

      {/* Footer Actions */}
      {photos.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Нашли ошибку в фотографиях?
          </h3>
          <p className="text-sm text-slate-600 mb-4 max-w-md">
            Если есть проблемы (чужой ребенок, неудачный кадр), отправьте запрос фотографу.
          </p>
          <Link href={`/classroom/${data.classroom.id}/request-edit`}>
            <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
              <FileEdit className="w-4 h-4" />
              Отправить запрос на исправление
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}