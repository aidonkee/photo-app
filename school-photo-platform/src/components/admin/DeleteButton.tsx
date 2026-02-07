'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type DeleteButtonProps = {
    id: string;
    entityName: string; // e.g. "School", "Classroom"
    deleteAction: (id: string) => Promise<{ success?: boolean; error?: string }>;
    redirectUrl?: string;
    className?: string;
};

export default function DeleteButton({
    id,
    entityName,
    deleteAction,
    redirectUrl,
    className,
}: DeleteButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            // Assuming deleteAction is a server action
            await deleteAction(id);

            toast.success(`${entityName} успешно удален`);
            setOpen(false);

            if (redirectUrl) {
                router.push(redirectUrl);
                router.refresh();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(`Ошибка при удалении ${entityName}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    className={className}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Удалить
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие необратимо. Это навсегда удалит {entityName} и все связанные данные (фотографии, заказы).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        disabled={loading}
                    >
                        {loading ? 'Удаление...' : 'Да, удалить'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
