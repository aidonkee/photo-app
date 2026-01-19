'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { approveOrderAction } from '@/actions/teacher/order-actions';
import { useRouter } from 'next/navigation';

// Мы можем оставить classId в пропсах (вдруг пригодится), но в функцию передаем только orderId
export default function ApproveOrderButton({ orderId, classId }: { orderId: string, classId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    setLoading(true);
    try {
      // ИСПРАВЛЕНИЕ: Передаем только orderId.
      // Функция approveOrderAction в order-actions.ts скорее всего выглядит как (id: string) => ...
      await approveOrderAction(orderId);
      
      router.refresh(); // Обновляем страницу, чтобы увидеть статус "APPROVED"
    } catch (error) {
      console.error(error);
      alert('Failed to approve order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleApprove} 
      disabled={loading}
      className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-lg"
    >
      {loading ? 'Processing...' : (
        <>
          <CheckCircle className="w-5 h-5 mr-2" />
          Подтвердить заказ и оплату
        </>
      )}
    </Button>
  );
}