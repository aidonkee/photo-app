'use client';

import { useActionState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSchoolAction } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Building2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

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
    if (state && 'success' in state && state.success) {
      setTimeout(() => {
        router.push(`/admin/schools/${schoolId}`);
      }, 1500);
    }
  }, [state, schoolId, router]);

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
            <p className="text-sm text-slate-600 mt-1">Обновите информацию о школе и цены</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Детали школы</CardTitle>
        </CardHeader>
        <CardContent>
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
                placeholder="Например:  Школа №17"
                required
                disabled={isPending}
                className="h-10 text-sm border-slate-300"
              />
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
                  className="h-10 w-12 p-1 border-slate-300"
                  defaultValue="#0f172a"
                />
                <Input
                  type="text"
                  placeholder="#0f172a"
                  disabled={isPending}
                  className="h-10 flex-1 font-mono text-sm border-slate-300"
                  defaultValue="#0f172a"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Цвет бренда для публичной страницы
              </p>
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

            {/* Error Alert */}
            {state && 'error' in state && (
              <Alert className="bg-slate-50 border-slate-200">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-xs text-slate-800">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {state && 'success' in state && state.success && (
              <Alert className="bg-slate-900 text-white border-slate-900">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <AlertDescription className="text-xs text-white">
                  {state.message} Перенаправление... 
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/schools/${schoolId}`)}
                disabled={isPending}
                className="flex-1 h-9 text-sm"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-9 text-sm bg-slate-900 text-white hover:bg-slate-800"
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
