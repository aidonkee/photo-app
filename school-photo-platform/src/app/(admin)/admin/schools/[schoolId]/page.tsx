import React from 'react';
import Link from 'next/link';
import { getSchoolById } from '@/actions/admin/school-actions';
import { getClassrooms } from '@/actions/admin/classroom-actions';
import ClassroomForm from '@/components/admin/ClassroomForm';
import SchoolLinkSection from '@/components/admin/SchoolLinkSection'; 
import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const school = await getSchoolById(schoolId);
  const classrooms = await getClassrooms(schoolId);
  const totalPhotos = classrooms.reduce((acc, curr) => acc + (curr._count?.photos || 0), 0);

  // Функция маскировки логина
  const maskLogin = (login: string) => {
    if (login.length <= 8) return '••••••';
    return login.substring(0, 4) + '••••••' + login.substring(login.length - 2);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Header: Компактный и строгий */}
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
                <code className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
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
            <Link href={`/admin/schools/${schoolId}/teachers`}>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900">
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Доступы</span>
              </Button>
            </Link>
            
            <Link href={`/admin/schools/${schoolId}/edit`}>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900">
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Настройки</span>
              </Button>
            </Link>
            
            {/* Форма создания класса (кнопка внутри компонента) */}
            <ClassroomForm schoolId={schoolId} />
          </div>
        </div>
      </div>
      
      {/* Секция ссылки (предполагаем, что она внутри тоже стилизована) */}
      <SchoolLinkSection slug={school.slug} />

      {/* Stats: Очень компактные карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        
        <Card className="border border-slate-200 bg-white shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Статус школы
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${school.isActive ? 'bg-slate-900' : 'bg-slate-300'}`} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((classroom) => (
              <Link 
                key={classroom.id} 
                href={`/admin/schools/${schoolId}/classrooms/${classroom.id}`}
                className="group block h-full"
              >
                <Card className="h-full border border-slate-200 hover:border-slate-900 shadow-none transition-colors duration-200 bg-white cursor-pointer">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:underline underline-offset-4 decoration-1 transition-all">
                        {classroom.name}
                      </CardTitle>
                      {classroom.isLocked && (
                        <Badge variant="outline" className="border-slate-900 text-slate-900 text-[10px] h-5 px-1.5 rounded-sm font-normal">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Закрыт
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2 space-y-3">
                    {/* Статистика (Фото / Заказы) */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Image className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{classroom._count.photos}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200" />
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{classroom._count.orders}</span>
                      </div>
                    </div>

                    {/* Информация об учителе */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                            Логин учителя
                          </p>
                          <div className="flex items-center gap-1.5">
                            {classroom.isEditAllowed ? (
                              <Eye className="w-3 h-3 text-slate-700 flex-shrink-0" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            )}
                            <code className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate w-full max-w-[120px]">
                              {maskLogin(classroom.teacherLogin)}
                            </code>
                          </div>
                        </div>
                        
                        {classroom.isEditAllowed && (
                          <Badge variant="secondary" className="text-[9px] h-5 px-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 self-end mb-0.5">
                            Ред. вкл
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Стрелка при наведении */}
                    <div className="flex items-center justify-end pt-1">
                      <span className="text-[10px] font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Открыть <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Вспомогательный компонент для карточки статистики (Refined)
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