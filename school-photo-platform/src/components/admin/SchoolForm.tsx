'use client';

import React, { useActionState, useEffect, useState } from 'react';
import { createSchoolAction } from '@/actions/admin/school-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

type SchoolFormProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function SchoolForm({ open, onOpenChange }: SchoolFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createSchoolAction, null);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        window.location.href = `/admin/schools/${state.schoolId}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, state?.schoolId, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button className="bg-slate-900 text-white hover:bg-slate-800 gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать школу</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 shadow-none">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Новая школа
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs mt-1">
            Заполните данные для создания нового учебного заведения.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-slate-700">Название школы *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="например, Школа №17"
              required
              disabled={isPending}
              className="h-10 text-sm border-slate-300 focus:border-slate-900 focus:ring-0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs font-medium text-slate-700">URL-адрес (Slug) *</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              placeholder="school-17"
              required
              disabled={isPending}
              className="h-10 text-sm font-mono border-slate-300 focus:border-slate-900 focus:ring-0"
            />
            <p className="text-[10px] text-slate-400">
              Только латинские буквы, цифры и дефис. Используется в ссылке для родителей.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryColor" className="text-xs font-medium text-slate-700">Основной цвет</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                disabled={isPending}
                className="h-10 w-12 p-1 border-slate-300 cursor-pointer"
                defaultValue="#0f172a"
              />
              <Input
                type="text"
                placeholder="#0f172a"
                disabled={isPending}
                className="h-10 flex-1 font-mono text-sm border-slate-300 focus:border-slate-900 focus:ring-0"
                defaultValue="#0f172a"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Цвет бренда для публичной страницы.
            </p>
          </div>

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
                Родители увидят переключатель языка на странице галереи.
              </p>
            </div>
          </div>

          {state?.error && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200 py-2">
              <AlertCircle className="h-4 w-4 text-red-900" />
              <AlertDescription className="text-xs ml-2">{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="bg-slate-900 text-white border-slate-900 py-2">
              <CheckCircle2 className="h-4 w-4 text-white" />
              <AlertDescription className="text-xs ml-2">
                {state.message} Перенаправление...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="flex-1 h-9 text-sm border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-9 text-sm bg-slate-900 text-white hover:bg-slate-800"
            >
              {isPending ? 'Создание...' : 'Создать школу'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}