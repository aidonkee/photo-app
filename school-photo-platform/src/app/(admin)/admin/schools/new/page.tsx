'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSchoolAction } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Building2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export default function NewSchoolPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createSchoolAction,
    null
  );

  useEffect(() => {
    if (state && 'success' in state && state.success && 'schoolId' in state) {
      setTimeout(() => {
        router.push(`/admin/schools/${state.schoolId}`);
      }, 1500);
    }
  }, [state, router]);

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
            {/* School Name */}
            <div className="space-y-1. 5">
              <Label htmlFor="name" className="text-xs font-medium text-slate-700">
                Название школы *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="например, Школа №17"
                required
                disabled={isPending}
                className="h-10 text-sm border-slate-300"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-medium text-slate-700">
                URL-адрес (Slug) *
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="school-17"
                required
                disabled={isPending}
                className="h-10 text-sm font-mono border-slate-300"
              />
              <p className="text-[10px] text-slate-400">
                Только латинские буквы, цифры и дефис
              </p>
            </div>

            {/* Primary Color */}
            <div className="space-y-1.5">
              <Label htmlFor="primaryColor" className="text-xs font-medium text-slate-700">
                Основной цвет
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  disabled={isPending}
                  defaultValue="#0f172a"
                  className="h-10 w-12 p-1 border-slate-300 cursor-pointer"
                />
                <Input
                  type="text"
                  placeholder="#0f172a"
                  disabled={isPending}
                  defaultValue="#0f172a"
                  className="h-10 flex-1 font-mono text-sm border-slate-300"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Ценообразование (₸)</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="priceA4" className="text-xs font-medium text-slate-700">
                    A4 Формат
                  </Label>
                  <Input
                    id="priceA4"
                    name="priceA4"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="1500"
                    defaultValue={1500}
                    disabled={isPending}
                    className="h-10 text-sm border-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priceA5" className="text-xs font-medium text-slate-700">
                    A5 Формат
                  </Label>
                  <Input
                    id="priceA5"
                    name="priceA5"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="1000"
                    defaultValue={1000}
                    disabled={isPending}
                    className="h-10 text-sm border-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priceMagnet" className="text-xs font-medium text-slate-700">
                    Фото-магнит
                  </Label>
                  <Input
                    id="priceMagnet"
                    name="priceMagnet"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="2000"
                    defaultValue={2000}
                    disabled={isPending}
                    className="h-10 text-sm border-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priceDigital" className="text-xs font-medium text-slate-700">
                    Цифровая копия
                  </Label>
                  <Input
                    id="priceDigital"
                    name="priceDigital"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="500"
                    defaultValue={500}
                    disabled={isPending}
                    className="h-10 text-sm border-slate-300 font-mono"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-2">
                Цены указываются в казахстанских тенге (₸)
              </p>
            </div>

            {/* Language Toggle */}
            <div className="flex items-start space-x-2 p-3 bg-slate-50 rounded border border-slate-100">
              <Checkbox
                id="isKazakhEnabled"
                name="isKazakhEnabled"
                disabled={isPending}
                className="mt-0.5 border-slate-400 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
              />
              <div className="flex-1">
                <Label
                  htmlFor="isKazakhEnabled"
                  className="text-xs font-medium text-slate-900 cursor-pointer"
                >
                  Включить казахский язык (RU/KZ)
                </Label>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Родители увидят переключатель языка на странице галереи
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {state && 'error' in state && (
              <Alert variant="destructive" className="bg-slate-50 border-slate-900 text-slate-900">
                <AlertCircle className="h-4 w-4 text-slate-900" />
                <AlertDescription className="ml-2 font-medium text-xs">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {state && 'success' in state && state.success && (
              <Alert className="bg-slate-900 text-white border-slate-900">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <AlertDescription className="ml-2 text-xs text-white">
                  {'message' in state && state.message} Перенаправление... 
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Link href="/admin/schools" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
                  disabled={isPending}
                >
                  Отмена
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-9 text-sm bg-slate-900 hover:bg-slate-800 text-white"
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
