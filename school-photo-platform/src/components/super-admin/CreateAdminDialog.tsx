'use client';

import React, { useActionState, useEffect, useState } from 'react';
import { createPhotographerAction } from '@/actions/super-admin/platform-actions';
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
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CreateAdminDialog() {
  const [state, formAction, isPending] = useActionState(
    createPhotographerAction,
    null
  );
  const [open, setOpen] = useState(false);

  // Закрыть диалог при успешном создании
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
          <UserPlus className="w-4 h-4" />
          Добавить фотографа
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Создать нового фотографа</DialogTitle>
          <DialogDescription>
            Добавьте нового администратора-фотографа для управления школами и фотографиями
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Иван"
                required
                disabled={isPending}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия *</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Иванов"
                required
                disabled={isPending}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Электронная почта *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="photographer@example.com"
              required
              disabled={isPending}
              autoComplete="email"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Номер телефона</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+7 (777) 000-0000"
              disabled={isPending}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Мин. 8 символов"
              required
              disabled={isPending}
              autoComplete="new-password"
              className="h-11"
            />
            <p className="text-xs text-slate-500">
              Должен содержать минимум 8 символов
            </p>
          </div>

          {state?.error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="bg-slate-50 text-slate-900 border-slate-200 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="h-4 w-4 text-slate-900" />
              <AlertDescription className="text-slate-700">
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-slate-900 hover:bg-blue-700"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Создается...
                </span>
              ) : (
                'Создать фотографа'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}