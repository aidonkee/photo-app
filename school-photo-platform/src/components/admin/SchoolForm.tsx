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
import { Plus, AlertCircle, CheckCircle2, Building2, DollarSign } from 'lucide-react';

type SchoolFormProps = {
  open?:  boolean;
  onOpenChange?: (open: boolean) => void;
  school?: {
    id: string;
    name: string;
    slug:  string;
    primaryColor: string;
    isKazakhEnabled: boolean;
    priceA4: number;
    priceA5: number;
  } | null;
};

export default function SchoolForm({ open, onOpenChange, school }: SchoolFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createSchoolAction, null);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const isEdit = !!school;

  useEffect(() => {
    if (state && 'success' in state && state.success && 'schoolId' in state) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        window.location.href = `/admin/schools/${state.schoolId}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, setIsOpen]);

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

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {isEdit ? 'Редактировать школу' : 'Новая школа'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs mt-1">
            {isEdit
              ? 'Обновите информацию о школе и ценообразование.'
              : 'Заполните данные для создания нового учебного заведения.'}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 pt-4">
          {/* Основная информация */}
          <div className="space-y-4">
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
                defaultValue={school?.name}
                className="h-10 text-sm border-slate-300"
              />
            </div>

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
                disabled={isPending || isEdit}
                defaultValue={school?.slug}
                className="h-10 text-sm font-mono border-slate-300"
              />
              <p className="text-[10px] text-slate-400">
                {isEdit
                  ? 'URL нельзя изменить после создания'
                  : 'Только латинские буквы, цифры и дефис'}
              </p>
            </div>

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
                  defaultValue={school?.primaryColor || '#0f172a'}
                  className="h-10 w-12 p-1 border-slate-300"
                />
                <Input
                  type="text"
                  placeholder="#0f172a"
                  disabled={isPending}
                  defaultValue={school?.primaryColor || '#0f172a'}
                  className="h-10 flex-1 font-mono text-sm border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* ✅ ОБНОВЛЕНО: Только A4 и A5 */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Ценообразование (₸)</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="priceA4" className="text-xs font-medium text-slate-700">
                  Формат A4
                </Label>
                <Input
                  id="priceA4"
                  name="priceA4"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="1500"
                  defaultValue={school?.priceA4 || 1500}
                  disabled={isPending}
                  className="h-10 text-sm border-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priceA5" className="text-xs font-medium text-slate-700">
                  Формат A5
                </Label>
                <Input
                  id="priceA5"
                  name="priceA5"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="1000"
                  defaultValue={school?.priceA5 || 1000}
                  disabled={isPending}
                  className="h-10 text-sm border-slate-300 font-mono"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              Цены указываются в казахстанских тенге (₸)
            </p>
          </div>

          {/* Переключатель языка */}
          <div className="flex items-start space-x-2 p-3 bg-slate-50 rounded border border-slate-100">
            <Checkbox
              id="isKazakhEnabled"
              name="isKazakhEnabled"
              disabled={isPending}
              defaultChecked={school?.isKazakhEnabled}
              className="mt-0.5 border-slate-400 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
            />
            <div className="flex-1">
              <Label htmlFor="isKazakhEnabled" className="text-xs font-medium text-slate-900 cursor-pointer">
                Включить казахский язык (RU/KZ)
              </Label>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Родители увидят переключатель языка
              </p>
            </div>
          </div>

          {/* Сообщение об ошибке */}
          {state && 'error' in state && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Сообщение об успехе */}
          {state && 'success' in state && state.success && (
            <Alert className="bg-slate-900 text-white border-slate-900 py-2">
              <CheckCircle2 className="h-4 w-4 text-white" />
              <AlertDescription className="text-xs text-white">
                {'message' in state && state.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Действия */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
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
              {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать школу'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}