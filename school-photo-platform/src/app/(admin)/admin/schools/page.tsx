import Link from 'next/link';
import { getSchools } from '@/actions/admin/school-actions';
import SchoolForm from '@/components/admin/SchoolForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мои Школы | Фотограф',
  description: 'Управляйте вашими школами',
};

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6">
      {/* Header: Компактный и строгий */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 rounded-md border border-slate-900">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
              Мои школы
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Управление учебными заведениями и классами
            </p>
          </div>
        </div>
        {/* Кнопка создания (внутри компонента) */}
        <SchoolForm />
      </div>

      {/* Grid */}
      {schools.length === 0 ? (
        <Card className="border border-dashed border-slate-300 bg-slate-50/50 shadow-none">
          <CardContent className="py-16 text-center">
            <div className="bg-white p-3 rounded-full w-fit mx-auto mb-3 border border-slate-200">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Список школ пуст
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              Начните с создания вашей первой школы, чтобы загружать фотографии.
            </p>
            <div className="inline-block">
               <SchoolForm />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((school) => (
            <Link key={school.id} href={`/admin/schools/${school.id}`} className="block h-full">
              <Card className="group h-full border border-slate-200 shadow-none hover:border-slate-900 transition-all duration-200 cursor-pointer bg-white">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 overflow-hidden">
                      <CardTitle className="text-base font-bold text-slate-900 truncate group-hover:underline underline-offset-4 decoration-1">
                        {school.name}
                      </CardTitle>
                      <div className="flex">
                        <code className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                          /{school.slug}
                        </code>
                      </div>
                    </div>
                    
                    {/* Status Badge: Compact Outline */}
                    {school.isActive ? (
                      <Badge variant="outline" className="border-slate-900 text-slate-900 text-[10px] h-5 px-1.5 rounded-sm font-normal whitespace-nowrap">
                        <CheckCircle className="w-2.5 h-2.5 mr-1" />
                        Активна
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-400 text-[10px] h-5 px-1.5 rounded-sm font-normal whitespace-nowrap">
                        <XCircle className="w-2.5 h-2.5 mr-1" />
                        Скрыта
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{school._count.classrooms}</span>
                      <span className="text-slate-400">
                        {school._count.classrooms === 1 ? 'класс' : 'классов'}
                      </span>
                    </div>

                    <div className="flex items-center text-[10px] font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200">
                      УПРАВЛЕНИЕ
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
