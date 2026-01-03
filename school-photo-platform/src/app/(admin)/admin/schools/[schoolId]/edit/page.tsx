'use client';

import React, { useActionState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSchoolAction } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default function SchoolEditPage({ params }: PageProps) {
  const { schoolId } = use(params);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    updateSchoolAction.bind(null, schoolId),
    null
  );

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.push(`/admin/schools/${schoolId}`);
      }, 1500);
    }
  }, [state?.success, schoolId, router]);

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
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Редактировать школу</h1>
            <p className="text-sm text-slate-600 mt-1">Обновите информацию о школе</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Детали школы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={formAction}>
            {/* School Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-xs font-medium text-slate-900">
                Название школы *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Например: Основная школа №7"
                required
                disabled={isPending}
                className="h-11 text-sm border-slate-300"
              />
            </div>

            {/* School Slug */}
            <div className="space-y-3">
              <Label htmlFor="slug" className="text-xs font-medium text-slate-900">
                URL-адрес
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="например: osnovnaiya-shkola-7"
                disabled
                className="h-11 text-sm border-slate-300 bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                URL-адрес нельзя изменить после создания школы
              </p>
            </div>

            {/* Primary Color */}
            <div className="space-y-3">
              <Label htmlFor="primaryColor" className="text-xs font-medium text-slate-900">
                Основной цвет
              </Label>
              <div className="flex gap-3">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  disabled={isPending}
                  className="h-11 w-20 border-slate-300"
                  defaultValue="#f97316"
                />
                <Input
                  type="text"
                  placeholder="#f97316"
                  disabled={isPending}
                  className="h-11 flex-1 text-center font-mono border-slate-300 text-sm"
                  defaultValue="#f97316"
                />
              </div>
              <p className="text-xs text-slate-500">
                Этот цвет будет использоваться в публичных галереях школы
              </p>
            </div>

            {/* Alerts */}
            {state?.error && (
              <Alert className="bg-slate-50 border-slate-200">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-xs text-slate-800">{state.error}</AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert className="bg-slate-50 border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-slate-900" />
                <AlertDescription className="text-xs text-slate-700">
                  {state.message} Перенаправление...
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/schools/${schoolId}`)}
                disabled={isPending}
                className="flex-1 text-slate-900 border-slate-300 hover:bg-slate-100"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
              >
                {isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}