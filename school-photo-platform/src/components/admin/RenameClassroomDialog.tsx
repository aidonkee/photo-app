'use client';

import React, { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { updateClassroomNameAction } from '@/actions/admin/classroom-actions';
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
import { Edit2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type RenameClassroomDialogProps = {
    classroomId: string;
    currentName: string;
    schoolId: string;
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
                    Сохранение...
                </>
            ) : (
                'Сохранить'
            )}
        </Button>
    );
}

export default function RenameClassroomDialog({ classroomId, currentName, schoolId }: RenameClassroomDialogProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Сброс ошибки при открытии/закрытии
    useEffect(() => {
        if (!open) setError(null);
    }, [open]);

    const handleSubmit = async (formData: FormData) => {
        try {
            const result = await updateClassroomNameAction(classroomId, schoolId, formData);

            if (result?.error) {
                setError(result.error);
            } else {
                setOpen(false);
            }
        } catch (err) {
            setError('Произошла ошибка при переименовании класса');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Edit2 className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[400px] bg-white border-slate-200 shadow-none">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-base font-semibold text-slate-900">
                        Переименовать класс
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                        Введите новое название для класса. Это изменение будет видно всем пользователям.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-4 py-4" onSubmit={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium text-slate-700">Название класса</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={currentName}
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
