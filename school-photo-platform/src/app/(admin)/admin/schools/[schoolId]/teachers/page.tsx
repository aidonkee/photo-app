import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSchoolById } from '@/actions/admin/school-actions';
import { getClassrooms } from '@/actions/admin/classroom-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CopyButton from '@/components/admin/CopyButton';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Unlock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default async function TeachersCredentialsPage({ params }: PageProps) {
  const { schoolId } = await params;

  try {
    const school = await getSchoolById(schoolId);
    const classrooms = await getClassrooms(schoolId);

    return (
      <div className="max-w-7xl mx-auto space-y-8 py-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <Link href={`/admin/schools/${schoolId}`}>
            <Button variant="ghost" className="gap-2 -ml-3 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Назад к школе
            </Button>
          </Link>

          <div className="flex items-start justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <KeyRound className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Доступы учителей</h1>
                <p className="text-sm text-slate-500 mt-1 font-mono">
                  {school.name} • {classrooms.length}{' '}
                  {classrooms.length === 1 ? 'Класс' : 'Классов'}
                </p>
              </div>
            </div>

            <Button variant="outline" className="gap-2 text-slate-900 border-slate-200 hover:border-slate-900">
              <Download className="w-4 h-4" />
              Экспорт (скоро)
            </Button>
          </div>
        </div>

        {/* Warning Alert - Monochrome */}
        <Alert className="bg-slate-50 border-slate-200 text-slate-900">
          <AlertCircle className="h-4 w-4 text-slate-900" />
          <AlertDescription className="text-sm text-slate-600 ml-2">
            Эти данные конфиденциальны. Передавайте их только через защищенные каналы связи.
          </AlertDescription>
        </Alert>

        {/* Credentials Table */}
        <Card className="border border-slate-200 shadow-none bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-500" />
              Учетные данные
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {classrooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-100">
                  <KeyRound className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">Классы не созданы</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Создайте классы в настройках школы, чтобы сгенерировать логины и пароли для учителей.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[200px] text-slate-500 font-medium">Класс</TableHead>
                      <TableHead className="text-slate-500 font-medium">Логин</TableHead>
                      <TableHead className="text-slate-500 font-medium">Пароль</TableHead>
                      <TableHead className="text-center text-slate-500 font-medium">Статус</TableHead>
                      <TableHead className="text-center text-slate-500 font-medium">Редактирование</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classrooms.map((classroom) => (
                      <TableRow key={classroom.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/schools/${schoolId}/classrooms/${classroom.id}`}
                            className="text-slate-900 hover:underline underline-offset-4 decoration-1"
                          >
                            {classroom.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">
                              {classroom.teacherLogin}
                            </code>
                            <CopyButton text={classroom.teacherLogin} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">
                              {classroom.teacherPassword || '••••••'}
                            </code>
                            {classroom.teacherPassword && (
                              <CopyButton text={classroom.teacherPassword} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {classroom.isLocked ? (
                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-normal">
                              <Lock className="w-3 h-3 mr-1" />
                              Закрыт
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-900 text-slate-900 font-normal">
                              <Unlock className="w-3 h-3 mr-1" />
                              Активен
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {classroom.isEditAllowed ? (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal">
                              Разрешено
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">Нет доступа</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats - Minimalist */}
        {classrooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Всего классов" value={classrooms.length} />
            <StatCard label="Активных аккаунтов" value={classrooms.filter((c) => !c.isLocked).length} />
            <StatCard label="Доступ к редактору" value={classrooms.filter((c) => c.isEditAllowed).length} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    notFound();
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border border-slate-200 shadow-none bg-white">
      <CardContent className="px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-2xl font-light text-slate-900">{value}</span>
      </CardContent>
    </Card>
  );
}