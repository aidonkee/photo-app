'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, EyeOff, KeyRound, Mail, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateTeacherCredentials, toggleClassroomLock, updateTeacherCredentials } from '@/actions/head-teacher/classrooms-actions';
import Link from 'next/link';

type ClassroomData = {
    id: string;
    name: string;
    teacherLogin: string;
    teacherPassword?: string | null;
    _count: {
        orders: number;
        photos: number;
    }
};

export default function ClassroomsClient({ initialClassrooms }: { initialClassrooms: ClassroomData[] }) {
    const router = useRouter();
    const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

    // Modal state
    const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [editLogin, setEditLogin] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const togglePasswordVisibility = (id: string) => {
        setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGeneratePassword = async (classId: string) => {
        try {
            setIsGenerating(classId);
            const result = await generateTeacherCredentials(classId);
            if (result.success) {
                toast.success('Новый пароль сгенерирован');
                router.refresh();
                // Auto reveal newly generated password
                setRevealedPasswords(prev => ({ ...prev, [classId]: true }));
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка генерации пароля');
        } finally {
            setIsGenerating(null);
        }
    };

    const openEditModal = (classroom: ClassroomData) => {
        setSelectedClassId(classroom.id);
        setEditLogin(classroom.teacherLogin);
        setEditPassword('');
        setIsCredsModalOpen(true);
    };

    const handleSaveCredentials = async () => {
        if (!selectedClassId || !editLogin) return;

        try {
            setIsSaving(true);
            const result = await updateTeacherCredentials(selectedClassId, editLogin, editPassword || undefined);
            if (result.success) {
                toast.success('Данные для входа обновлены');
                setIsCredsModalOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сохранения данных');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full pb-2">
                <Table className="min-w-[800px] [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-r [&_td:last-child]:border-r-0">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Класс</TableHead>
                            <TableHead className="w-[300px]">Данные для входа учителя</TableHead>
                            <TableHead className="w-[200px]">Статистика</TableHead>
                            <TableHead className="text-right w-[150px]">Галерея</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialClassrooms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    В школе пока нет добавленных классов. Классы добавляются Администратором.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialClassrooms.map(classroom => (
                                <TableRow key={classroom.id}>
                                    <TableCell className="font-medium">{classroom.name}</TableCell>

                                    <TableCell>
                                        <div className="flex flex-col gap-2 max-w-[280px]">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-slate-500 font-medium">Логин:</span>
                                                <span className="font-medium">{classroom.teacherLogin}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-slate-500 font-medium">Пароль:</span>
                                                <div className="flex-1 font-mono bg-slate-100 px-2 py-1 rounded text-xs tracking-wider relative flex items-center justify-between group">
                                                    <span className={!revealedPasswords[classroom.id] ? "blur-sm opacity-60" : ""}>
                                                        {classroom.teacherPassword || '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePasswordVisibility(classroom.id)}
                                                        className="pointer-events-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                                                        title="Показать/скрыть"
                                                    >
                                                        {revealedPasswords[classroom.id] ? <EyeOff className="w-3 h-3 text-slate-600" /> : <Eye className="w-3 h-3 text-slate-600" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-col text-sm text-slate-600">
                                            <span>Фотографий: {classroom._count.photos}</span>
                                            <span>Заказов: {classroom._count.orders}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/head-teacher/classrooms/${classroom.id}/gallery`}>
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                Смотреть
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Credentials Modal */}
            <Dialog open={isCredsModalOpen} onOpenChange={setIsCredsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Данные для входа учителя</DialogTitle>
                        <DialogDescription>
                            Вы можете изменить логин и задать новый пароль вручную. Если оставить поле пароля пустым, он не изменится.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="login">Логин</Label>
                            <Input
                                id="login"
                                value={editLogin}
                                onChange={(e) => setEditLogin(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Новый пароль (опционально)</Label>
                            <Input
                                id="password"
                                type="text"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="Оставьте пустым для сохранения старого"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCredsModalOpen(false)} disabled={isSaving}>
                            Отмена
                        </Button>
                        <Button onClick={handleSaveCredentials} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
