'use client';

import React, { useActionState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClassroomAction } from '@/actions/admin/classroom-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Users,
  AlertCircle,
  CheckCircle2,
  Key,
  Copy,
  UserCircle,
} from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default function NewClassroomPage({ params }: PageProps) {
  const { schoolId } = use(params);
  const router = useRouter();
  const [copied, setCopied] = React.useState<'login' | 'password' | null>(null);

  const [state, formAction, isPending] = useActionState(
    createClassroomAction.bind(null, schoolId),
    null
  );

  const copyToClipboard = (text: string, type: 'login' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <Link href={`/admin/schools/${schoolId}`}>
          <Button variant="ghost" className="gap-2 -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Назад к школе
          </Button>
        </Link>

        <div className="flex items-center gap-3 mt-3">
          <div className="p-2.5 bg-slate-900 rounded-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Создать новый класс
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Добавьте класс и создайте учетные данные учителя
            </p>
          </div>
        </div>
      </div>

      {/* Success Card */}
      {state?.success && state?.teacherLogin && state?.plainPassword ? (
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Класс успешно создан!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                ⚠️ Сохраните учетные данные. Пароль больше не будет отображён!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {/* Teacher Login */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-slate-900" />
                    Логин учителя
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(state.teacherLogin, 'login')}
                  >
                    {copied === 'login' ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </Button>
                </div>
                <code className="text-sm block font-mono bg-white border border-slate-200 rounded py-2 px-3 mt-2 text-slate-900">
                  {state.teacherLogin}
                </code>
              </div>

              {/* Teacher Password */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-900" />
                    Пароль учителя
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(state.plainPassword, 'password')}
                  >
                    {copied === 'password' ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </Button>
                </div>
                <code className="text-sm block font-mono bg-white border border-slate-200 rounded py-2 px-3 mt-2 text-slate-900">
                  {state.plainPassword}
                </code>
              </div>
            </div>

            <Button
              onClick={() => router.push(`/admin/schools/${schoolId}`)}
              className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Готово — Вернуться к школе
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Информация о классе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={formAction}>
              <div className="space-y-3">
                <Label htmlFor="name" className="text-xs font-medium text-slate-900">
                  Название класса
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  disabled={isPending}
                  placeholder="Например: 11Б"
                  className="h-11 text-sm border-slate-300"
                />
                <p className="text-xs text-slate-500">
                  Укажите уникальное и понятное название для класса
                </p>
              </div>

              <Alert className="bg-slate-50 border-slate-200 mt-3">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-xs text-slate-600">
                  Учетные данные учителя будут сгенерированы автоматически.
                </AlertDescription>
              </Alert>

              {state?.error && (
                <Alert className="bg-red-50 border-red-200 mt-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-xs text-red-800">
                    {state.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="flex-1 text-slate-900 border-slate-300 hover:bg-slate-100"
                  onClick={() => router.push(`/admin/schools/${schoolId}`)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 text-white bg-slate-900 hover:bg-slate-800"
                >
                  {isPending ? 'Создание...' : 'Создать класс'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}