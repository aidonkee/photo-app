import React from 'react';
import Link from 'next/link';
import { getSchoolById } from '@/actions/admin/school-actions';
import { getClassrooms } from '@/actions/admin/classroom-actions';
import ClassroomForm from '@/components/admin/ClassroomForm';
import SchoolLinkSection from '@/components/admin/SchoolLinkSection';
import { signSchoolAccess } from '@/lib/auth';
import { KeyRound, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SchoolFolderUploader from '@/components/admin/SchoolFolderUploader';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteSchoolAction } from '@/actions/admin/school-actions';
import ClassroomCard from '@/components/admin/ClassroomCard';
import {
  Building2,
  Users,
  Image,
  Settings,
  ArrowRight,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default async function SchoolDetailsPage({ params }: PageProps) {
  const { schoolId } = await params;
  const [school, classrooms] = await Promise.all([
    getSchoolById(schoolId),
    getClassrooms(schoolId),
  ]);
  const totalPhotos = classrooms.reduce((acc, curr) => acc + (curr._count?.photos || 0), 0);
  const totalOrders = classrooms.reduce((acc, curr) => acc + (curr._count?.orders || 0), 0);

  // Generate secure token for school access
  const schoolToken = await signSchoolAccess(school.slug);

  // Функция маскировки логина
  const maskLogin = (login: string) => {
    if (login.length <= 8) return '••••••';
    return login.substring(0, 4) + '••••••' + login.substring(login.length - 2);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Header:  Компактный и строгий */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-md border border-slate-900">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                {school.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs font-mono text-slate-600 bg-slate-100 px-1. 5 py-0.5 rounded border border-slate-200">
                  {school.slug}
                </code>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {classrooms.length} {classrooms.length === 1 ? 'класс' : 'классов'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SchoolFolderUploader schoolId={schoolId} />
            {/* 🆕 КНОПКА ЗАКАЗОВ */}
            <Link href={`/admin/schools/${schoolId}/orders`}>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900">
                <ShoppingCart className="w-3. 5 h-3.5" />
                <span className="hidden sm:inline">Заказы</span>
                {totalOrders > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1. 5 text-[10px] bg-slate-900 text-white">
                    {totalOrders}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href={`/admin/schools/${schoolId}/teachers`}>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900">
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Доступы</span>
              </Button>
            </Link>

            <Link href={`/admin/schools/${schoolId}/edit`}>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900">
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm: inline">Настройки</span>
              </Button>
            </Link>



            <ClassroomForm schoolId={schoolId} />

            <DeleteButton
              id={schoolId}
              entityName="Школу"
              deleteAction={deleteSchoolAction}
              redirectUrl="/admin/dashboard"
              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
            />
          </div>
        </div>
      </div>
      <SchoolLinkSection slug={school.slug} token={schoolToken} />

      {/* Stats:  Очень компактные карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard
          label="Всего классов"
          value={school._count.classrooms}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Всего фотографий"
          value={totalPhotos}
          icon={<Image className="w-4 h-4" />}
        />
        {/* 🆕 СТАТИСТИКА ЗАКАЗОВ */}
        <StatCard
          label="Всего заказов"
          value={totalOrders}
          icon={<ShoppingCart className="w-4 h-4" />}
        />

        <Card className="border border-slate-200 bg-white shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0. 5">
                Статус школы
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-1. 5 h-1.5 rounded-full ${school.isActive ? 'bg-slate-900' : 'bg-slate-300'}`} />
                <span className="text-lg font-semibold text-slate-900 leading-none">
                  {school.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </div>
            </div>
            {school.isActive ? (
              <Unlock className="w-4 h-4 text-slate-900" />
            ) : (
              <Lock className="w-4 h-4 text-slate-300" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Сетка классов */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Список классов</h2>
        </div>

        {classrooms.length === 0 ? (
          <Card className="border border-dashed border-slate-300 bg-slate-50/50 shadow-none">
            <CardContent className="py-12 text-center">
              <div className="inline-flex p-3 bg-white rounded-full border border-slate-200 mb-3">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Классы не созданы
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                Добавьте первый класс, чтобы начать загрузку фотографий и генерацию доступов.
              </p>
              <div className="inline-block">
                <ClassroomForm schoolId={schoolId} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md: grid-cols-2 lg: grid-cols-3 gap-4">
            {classrooms.map((classroom) => (
              <ClassroomCard key={classroom.id} classroom={classroom} schoolId={schoolId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Вспомогательный компонент для карточки статистики
function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {label}
          </p>
          <p className="text-lg font-semibold text-slate-900 tabular-nums leading-none">
            {value}
          </p>
        </div>
        <div className="text-slate-200">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
