'use client';

import React, { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSchoolAction } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewSchoolPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createSchoolAction,
    null
  );

  useEffect(() => {
    if (state?.success && state?.schoolId) {
      setTimeout(() => {
        router.push(`/admin/schools/${state.schoolId}`);
      }, 1500);
    }
  }, [state?.success, state?.schoolId, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div>
        <Link href="/admin/schools">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-3 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Назад к школам
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-md border border-slate-900">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
              Создать новую школу
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Добавьте новую школу в ваш портфель для управления классами
            </p>
          </div>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-none bg-white">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">
            Информация о школе
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Название школы *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="например, Средняя школа №17"
                required
                disabled={isPending}
                className="h-10 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                URL-адрес (Slug) *
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="например, school-17"
                required
                disabled={isPending}
                className="h-10 border-slate-300 focus:border-slate-900 focus:ring-slate-900 font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                Только строчные латинские буквы, цифры и дефисы.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-sm font-medium text-slate-700">
                Основной цвет (необязательно)
              </Label>
              <div className="flex gap-3">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  disabled={isPending}
                  className="h-10 w-16 p-1 border-slate-300 cursor-pointer"
                  defaultValue="#0f172a"
                />
                <Input
                  type="text"
                  placeholder="#0f172a"
                  disabled={isPending}
                  className="h-10 flex-1 font-mono text-sm border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  defaultValue="#0f172a"
                />
              </div>
              <p className="text-xs text-slate-500">
                Цвет бренда для публичной страницы родителей
              </p>
            </div>

            {state?.error && (
              <Alert variant="destructive" className="bg-slate-50 border-slate-900 text-slate-900">
                <AlertCircle className="h-4 w-4 text-slate-900" />
                <AlertDescription className="ml-2 font-medium">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert className="bg-slate-900 text-white border-slate-900">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <AlertDescription className="ml-2">
                  {state.message} Перенаправление...
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Link href="/admin/schools" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  disabled={isPending}
                >
                  Отмена
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Создание...
                  </span>
                ) : (
                  'Создать школу'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}