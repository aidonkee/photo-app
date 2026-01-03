'use client';

import React, { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createClassroomAction } from '@/actions/admin/classroom-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ClassroomFormProps = {
  schoolId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full h-9 text-sm bg-slate-900 text-white hover:bg-slate-800"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Создание...
        </>
      ) : (
        'Создать класс'
      )}
    </Button>
  );
}

export default function ClassroomForm({ schoolId, open, onOpenChange }: ClassroomFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const show = isControlled ? open : internalOpen;
  const setShow = isControlled ? onOpenChange : setInternalOpen;

  // Сброс ошибки при открытии/закрытии
  useEffect(() => {
    if (!show) setError(null);
  }, [show]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await createClassroomAction(schoolId, null, formData);
      
      if (result?.error) {
        setError(result.error);
      } else {
        if (setShow) setShow(false);
      }
    } catch (err) {
      setError('Произошла ошибка при создании класса');
    }
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="h-9 gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm">
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Добавить класс</span>
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[400px] bg-white border-slate-200 shadow-none">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Новый класс
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Введите название класса (например, "11 А"). Логин генерируется автоматически.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-slate-700">Название класса</Label>
            <Input
              id="name"
              name="name"
              placeholder="11 A"
              required
              autoFocus
              className="h-9 text-sm border-slate-300 focus:border-slate-900 focus:ring-0"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-slate-50 text-slate-900 border-slate-200 py-2">
              <AlertCircle className="h-3 w-3 text-slate-900" />
              <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="pt-2">
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}