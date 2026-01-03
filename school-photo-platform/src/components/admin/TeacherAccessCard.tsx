'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  KeyRound, 
  User 
} from 'lucide-react';
import { toast } from 'sonner'; // Или используйте ваш обычный alert, если нет sonner

type TeacherAccessCardProps = {
  classroomId: string;
  teacherLogin: string;
  teacherPassword?: string | null; // Пароль может быть null
};

export default function TeacherAccessCard({ 
  classroomId, 
  teacherLogin, 
  teacherPassword 
}: TeacherAccessCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopy = (text: string, type: 'login' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'login') {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  return (
    <Card className="bg-blue-50/50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <KeyRound className="w-5 h-5 text-blue-600" />
          Доступ учителя (Teacher Access)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Блок Логина */}
          <div className="space-y-2">
            <Label className="text-slate-600 flex items-center gap-2">
              <User className="w-4 h-4" /> Логин
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  value={teacherLogin} 
                  readOnly 
                  className="bg-white font-mono text-slate-900 pr-10"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleCopy(teacherLogin, 'login')}
                className={copiedLogin ? "text-green-600 border-green-200 bg-green-50" : ""}
              >
                {copiedLogin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Блок Пароля */}
          <div className="space-y-2">
            <Label className="text-slate-600 flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Пароль
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={teacherPassword || ''} 
                  readOnly 
                  className="bg-white font-mono text-slate-900 pr-10"
                  placeholder="Пароль не установлен"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => teacherPassword && handleCopy(teacherPassword, 'password')}
                disabled={!teacherPassword}
                className={copiedPassword ? "text-green-600 border-green-200 bg-green-50" : ""}
              >
                {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Кнопка сброса (функционал добавим позже, пока просто UI) */}
            <button 
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 font-medium transition-colors"
              onClick={() => alert('Функционал сброса пароля нужно подключить к Server Action')}
            >
              <RefreshCw className="w-3 h-3" />
              Сбросить пароль
            </button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}