'use client';

import React, { useActionState } from 'react'; // В Next.js 15 используем useActionState
import { teacherLoginAction } from '@/actions/teacher/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TeacherLoginPage() {
  const [state, formAction, isPending] = useActionState(teacherLoginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Добро пожаловать
          </CardTitle>
          <CardDescription>
            Войдите в свой аккаунт учителя, чтобы продолжить
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логин учителя</Label>
              <Input
                id="login"
                name="teacherLogin"  // <--- ВАЖНО: должно быть teacherLogin
                placeholder="Например: nis-ptr_11b"
                required
                className="h-11 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
              </div>
              <Input
                id="password"
                name="teacherPassword" // <--- ВАЖНО: должно быть teacherPassword
                type="password"
                placeholder="Введите 6 цифр"
                required
                className="h-11 bg-slate-50"
              />
            </div>

            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-lg"
              disabled={isPending}
            >
              {isPending ? 'Вход...' : 'Войти как учитель'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}