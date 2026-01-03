import React from 'react';
import Link from 'next/link';
import { getClassroomPhotos, getTeacherDashboardData } from '@/actions/teacher/dashboard-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Image,
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
  await params; // Await params to use it
  const photos = await getClassroomPhotos();
  const data = await getTeacherDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Фотографии класса {data.classroom.name}
          </h1>
          <p className="text-slate-600 mt-2">
            {photos.length} {photos.length === 1 ? 'фотография' : 'фотографий'} доступно
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/classroom/${data.classroom.id}/request-edit`}>
            <Button variant="outline" className="gap-2">
              <FileEdit className="w-4 h-4" />
              Запросить изменения
            </Button>
          </Link>
          {data.classroom.isLocked ? (
            <Badge variant="destructive" className="text-base px-4 py-2">
              <Lock className="w-4 h-4 mr-2" />
              Заблокировано
            </Badge>
          ) : (
            <Badge className="bg-slate-900 text-base px-4 py-2">
              <Unlock className="w-4 h-4 mr-2" />
              Открыто
            </Badge>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-slate-50 border-slate-200">
        <Info className="h-4 w-4 text-slate-900" />
        <AlertDescription className="text-slate-700">
          Эти фотографии видны родителям с кодами доступа. Водяные знаки будут удалены на приобретённых отпечатках.
        </AlertDescription>
      </Alert>

      {/* Status Warning */}
      {data.classroom.isLocked && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Этот класс заблокирован для печати. Родители больше не могут размещать новые заказы.
          </AlertDescription>
        </Alert>
      )}

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Галерея фотографий</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Фотографии ещё не загружены
              </h3>
              <p className="text-slate-600">
                Фотографии появятся здесь, как только фотограф их загрузит
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-slate-100 rounded-lg border-2 border-slate-200 hover:border-indigo-400 transition-all overflow-hidden group relative"
                >
                  {/* Photo Rendering Logic */}
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 relative">
                    {photo.watermarkedUrl ? (
                      // Если ссылка есть — показываем фото
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.watermarkedUrl}
                        alt={photo.alt || 'Школьная фотография'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      // Если ссылки нет — показываем иконку
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Image className="w-12 h-12 mb-2" />
                        <span className="text-xs">Нет изображения</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge className="bg-white text-slate-900 shadow-md">
                        Просмотр
                      </Badge>
                    </div>
                  </div>

                  {/* Info footer on photo */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none">
                    <p className="text-xs text-white truncate font-medium">
                      {photo.alt || 'Фотография'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {photos.length > 0 && (
        <Card className="border-2 border-indigo-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Нужно внести изменения?
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Если вы заметили какие-либо проблемы с фотографиями (неправильные имена, отсутствующие ученики и т.д.), 
                вы можете запросить изменения у фотографа.
              </p>
              <Link href={`/classroom/${data.classroom.id}/request-edit`}>
                <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
                  <FileEdit className="w-4 h-4" />
                  Запросить изменения фотографий
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
