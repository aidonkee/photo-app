import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';
import { getClassroomPhotos, getTeacherDashboardData } from '@/actions/teacher/dashboard-actions';
import TeacherOrderCreator from '@/components/teacher/TeacherOrderCreator';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Создание заказа',
  description: 'Создать заказ для роли родителя',
};

async function CreateOrderContent() {
  const dashboardData = await getTeacherDashboardData();
  const photos = await getClassroomPhotos();

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/teacher-dashboard">
            <Button variant="outline" size="sm" className="gap-2 text-slate-600 font-bold">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold text-slate-900">Новый заказ</h1>
            <p className="text-sm text-slate-500 font-medium">Для {dashboardData.classroom.name}</p>
          </div>
        </div>

        <TeacherOrderCreator
          photos={photos}
          schoolPricing={dashboardData.school}
        />
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CreateOrderContent />
    </Suspense>
  );
}
