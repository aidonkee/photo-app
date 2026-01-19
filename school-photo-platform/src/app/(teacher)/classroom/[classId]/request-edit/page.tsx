'use client';

import React, { useActionState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEditRequestAction } from '@/actions/teacher/edit-request-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileEdit, AlertCircle, CheckCircle2, Info } from 'lucide-react';

type PageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default function RequestEditPage({ params }: PageProps) {
  const { classId } = use(params);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createEditRequestAction,
    null
  );

  React.useEffect(() => {
    if (state?. success) {
      setTimeout(() => {
        router.push('/teacher-dashboard');
      }, 2000);
    }
  }, [state?. success, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/classroom/${classId}`}>
          <Button variant="ghost" className="gap-2 mb-4 -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Назад к фотографиям
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 rounded-lg">
            <FileEdit className="w-8 h-8 text-slate-900" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Запрос на редактирование фотографий
            </h1>
            <p className="text-slate-600 mt-1">
              Свяжитесь с фотографом по поводу проблем с фотографиями
            </p>
          </div>
        </div>
      </div>

      <Alert className="bg-slate-50 border-slate-200">
        <Info className="h-4 w-4 text-slate-900" />
        <AlertDescription className="text-slate-700">
          Используйте эту форму, чтобы сообщить о таких проблемах, как неправильные имена учеников, отсутствующие фотографии или другие необходимые исправления. Фотограф рассмотрит ваш запрос.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Опишите проблему</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Что нужно исправить? *
              </Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Пожалуйста, опишите проблему подробно. Например: 'На фото №12 указано неправильное имя ученика - должно быть Иван Иванов, а не Мария Петрова' или 'Отсутствуют фотографии учеников из 3 ряда'"
                required
                disabled={isPending}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                Пожалуйста, будьте как можно более конкретны (минимум 10 символов)
              </p>
            </div>

            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert className="bg-slate-50 text-slate-900 border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-slate-900" />
                <AlertDescription className="text-slate-700">
                  {state.message} Перенаправление...
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Link href={`/classroom/${classId}`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isPending}
                >
                  Отмена
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </span>
                ) : (
                  'Отправить запрос'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-amber-900 mb-2">
            Важные заметки:
          </h3>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Фотограф рассмотрит ваш запрос в течение 24-48 часов</li>
            <li>Вы можете иметь только один ожидающий запрос одновременно</li>
            <li>После одобрения вы сможете внести необходимые изменения</li>
            <li>В случае срочных вопросов свяжитесь с администратором вашей школы напрямую</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
