import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getPhotos } from '@/actions/admin/photo-actions';
import PhotoUploader from '@/components/admin/PhotoUploader';
import TeacherAccessCard from '@/components/admin/TeacherAccessCard';
import PhotoGallery from '@/components/admin/PhotoGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Image,
  ArrowLeft,
  ShoppingCart,
  FileEdit,
  Lock,
  Unlock,
} from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolId: string;
    classId: string;
  }>;
};

export default async function ClassroomDetailsPage({ params }: PageProps) {
  const { schoolId, classId } = await params;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    include: {
      school: true,
      _count: {
        select: {
          photos: true,
          orders: true,
        },
      },
    },
  });

  if (!classroom) {
    notFound();
  }

  const photos = await getPhotos(classId);

  // @ts-ignore
  const editRequestsCount = classroom._count?.editRequests || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-900 rounded-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {classroom.name}
              </h1>
              <p className="text-sm text-slate-600 mt-1 font-mono">
                {classroom.school.name} •{' '}
                <span className="tabular-nums text-slate-700">{photos.length}</span>{' '}
                {photos.length === 1 ? 'Фотография' : 'Фотографии'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {classroom.isLocked ? (
              <Badge variant="outline" className="h-6 px-3 text-xs border-slate-300 text-slate-700">
                <Lock className="w-4 h-4 mr-1" />
                Заблокирован
              </Badge>
            ) : (
              <Badge variant="outline" className="h-6 px-3 text-xs border-slate-300 text-slate-700">
                <Unlock className="w-4 h-4 mr-1" />
                Активен
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row - compact, monochrome */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Фотографии"
          value={classroom._count.photos}
          icon={<Image className="w-5 h-5 text-slate-500" />}
        />
        <StatCard
          label="Заказы"
          value={classroom._count.orders}
          icon={<ShoppingCart className="w-5 h-5 text-slate-500" />}
        />
        <StatCard
          label="Запросы на редактирование"
          value={editRequestsCount}
          icon={<FileEdit className="w-5 h-5 text-slate-500" />}
        />
      </div>

      {/* Teacher Access Card */}
      <TeacherAccessCard
        classroomId={classroom.id}
        teacherLogin={classroom.teacherLogin}
        teacherPassword={classroom.teacherPassword}
      />

      {/* Photo Uploader */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Загрузка фотографий</h2>
        </div>
        <PhotoUploader classId={classId} />
      </div>

      {/* Photo Gallery with Bulk Delete */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Загруженные фотографии <span className="text-sm text-slate-500">({photos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <PhotoGallery photos={photos} classId={classId} />
        </CardContent>
      </Card>
    </div>
  );
}

/* Compact, monochrome StatCard used on this page */
function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardContent className="pt-3 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
          </div>
          <div className="text-slate-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}