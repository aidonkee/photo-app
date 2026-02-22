'use client';

import React, { useActionState } from 'react';
import { loginAdminAction } from '@/actions/auth';
import { loginHeadTeacherAction } from '@/actions/head-teacher/auth-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCog, GraduationCap, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [adminState, adminFormAction, adminPending] = useActionState(
    loginAdminAction,
    null
  );
  const [headTeacherState, headTeacherFormAction, headTeacherPending] = useActionState(
    loginHeadTeacherAction,
    null
  );

  return (
    <Card className="shadow-2xl border-0">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Добро пожаловать
        </CardTitle>
        <CardDescription className="text-center text-base">
          Войдите в свой аккаунт, чтобы продолжить
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="admin" className="flex items-center gap-2 text-base data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <UserCog className="w-5 h-5" />
              Администратор
            </TabsTrigger>
            <TabsTrigger value="head-teacher" className="flex items-center gap-2 text-base data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <GraduationCap className="w-5 h-5" />
              Завуч
            </TabsTrigger>
          </TabsList>

          {/* Admin Login Tab */}
          <TabsContent value="admin" className="mt-0">
            <form action={adminFormAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">
                  Адрес электронной почты
                </Label>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  disabled={adminPending}
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">
                  Пароль
                </Label>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="Введите ваш пароль"
                  required
                  disabled={adminPending}
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>

              {adminState?.error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{adminState.error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-base font-medium"
                disabled={adminPending}
              >
                {adminPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Вход...
                  </span>
                ) : (
                  'Войти как администратор'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Head Teacher Login Tab */}
          <TabsContent value="head-teacher" className="mt-0">
            <form action={headTeacherFormAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="head-teacher-login" className="text-sm font-medium">
                  Логин завуча
                </Label>
                <Input
                  id="head-teacher-login"
                  name="headTeacherLogin"
                  type="text"
                  placeholder="Введите ваш логин завуча"
                  required
                  disabled={headTeacherPending}
                  autoComplete="username"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="head-teacher-password" className="text-sm font-medium">
                  Пароль
                </Label>
                <Input
                  id="head-teacher-password"
                  name="headTeacherPassword"
                  type="password"
                  placeholder="Введите ваш пароль"
                  required
                  disabled={headTeacherPending}
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>

              {headTeacherState?.error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{headTeacherState.error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-base font-medium"
                disabled={headTeacherPending}
              >
                {headTeacherPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Вход...
                  </span>
                ) : (
                  'Войти как завуч'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
