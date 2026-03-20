'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { toggleOrderPaymentStatus } from '@/actions/admin/order-actions';

type AdminOrderPaymentToggleProps = {
    orderId: string;
    isPaid: boolean;
};

export default function AdminOrderPaymentToggle({ orderId, isPaid }: AdminOrderPaymentToggleProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handlePaymentToggle = (checked: boolean) => {
        startTransition(async () => {
            try {
                await toggleOrderPaymentStatus(orderId, checked);
                toast.success(checked ? 'Статус обновлен: Оплачено' : 'Статус обновлен: Не оплачено');
                router.refresh();
            } catch (err: any) {
                toast.error('Не удалось обновить статус оплаты');
                console.error(err);
            }
        });
    };

    return (
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
            <Switch
                id="payment-status-admin"
                checked={isPaid}
                onCheckedChange={handlePaymentToggle}
                disabled={isPending}
            />
            <Label htmlFor="payment-status-admin" className="text-sm font-medium text-slate-700 cursor-pointer">
                {isPaid ? 'Оплачено' : 'Не оплачено'}
            </Label>
        </div>
    );
}
