'use client';

import React, { useState } from 'react';
import { updateHeadTeacherCredentials } from '@/actions/admin/school-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCog, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HeadTeacherAccessCardProps {
    schoolId: string;
    initialLogin?: string | null;
    initialPassword?: string | null;
}

export default function HeadTeacherAccessCard({
    schoolId,
    initialLogin,
    initialPassword
}: HeadTeacherAccessCardProps) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setError(null);
        setSuccessMessage(null);

        const formData = new FormData(e.currentTarget);
        const result = await updateHeadTeacherCredentials(schoolId, formData);

        setIsPending(false);

        if (result.error) {
            setError(result.error);
        } else if (result.success) {
            setSuccessMessage(result.message || 'Успешно обновлено');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    return (
        <Card className="border border-slate-200 shadow-none bg-white mb-8">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-indigo-600" />
                    Доступ завуча
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="headTeacherLogin">Логин завуча</Label>
                            <Input
                                id="headTeacherLogin"
                                name="headTeacherLogin"
                                placeholder="school_head_login"
                                defaultValue={initialLogin || ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headTeacherPassword">Пароль завуча</Label>
                            <Input
                                id="headTeacherPassword"
                                name="headTeacherPassword"
                                placeholder="******"
                                defaultValue={initialPassword || ''}
                            />
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="py-2 border-green-200 bg-green-50 text-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-sm">{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isPending} className="bg-slate-900 hover:bg-slate-800">
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Сохранение...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Сохранить
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
