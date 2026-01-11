import React, { Suspense } from 'react';
import Link from 'next/link';
import { getTeacherOrders, getOrderById } from '@/actions/teacher/order-actions';
import ParentOrdersList from '@/components/teacher/ParentOrdersList';
import OrderDetailView from '@/components/teacher/OrderDetailView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Проверка заказов',
  description: 'Панель учителя',
};

type PageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

async function DashboardContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const orders = await getTeacherOrders();
  
  // Логика выбора: берем из URL или (ТОЛЬКО ДЛЯ ДЕСКТОПА) первый из списка
  // Для мобильных важно: если нет orderId, мы не выбираем ничего автоматически, чтобы показать список
  const selectedOrderId = params.orderId;
  
  // Если orderId есть, грузим детали. Если нет, но мы на десктопе, можно бы загрузить первый, 
  // но чтобы упростить серверную логику, оставим управление через URL.
  // Если на десктопе ничего не выбрано, пользователь увидит "Выберите заказ".
  
  const selectedOrder = selectedOrderId ? await getOrderById(selectedOrderId) : (orders.length > 0 ? await getOrderById(orders[0].id) : null);
  
  // Проверяем, есть ли активный выбор для мобильной логики
  const hasSelection = !!selectedOrderId;

  return (
    <div className="h-[calc(100vh-65px)] bg-slate-50 overflow-hidden flex">
      {/* ЛЕВАЯ КОЛОНКА (СПИСОК)
         На мобильном: Скрываем (hidden), если выбран заказ. Показываем (block), если не выбран.
         На десктопе (md): Всегда показываем (block), ширина фиксированная или 4/12.
      */}
      <div className={`
        w-full md:w-[320px] lg:w-[380px] h-full bg-white border-r border-slate-200 flex-shrink-0
        ${hasSelection ? 'hidden md:block' : 'block'}
      `}>
        <ParentOrdersList orders={orders} />
      </div>

      {/* ПРАВАЯ КОЛОНКА (ДЕТАЛИ) 
         На мобильном: Показываем (block), если выбран заказ. Скрываем (hidden), если не выбран.
         На десктопе: Всегда показываем.
      */}
      <div className={`
        flex-1 h-full overflow-y-auto bg-slate-50
        ${hasSelection ? 'block' : 'hidden md:block'}
      `}>
        {selectedOrder ? (
          <div className="h-full flex flex-col">
            {/* Кнопка НАЗАД только для мобильных */}
            <div className="md:hidden p-4 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-2">
              <Link href="/teacher-dashboard">
                <Button variant="ghost" size="sm" className="-ml-2 gap-1 text-slate-600">
                  <ArrowLeft className="w-4 h-4" />
                  Назад к списку
                </Button>
              </Link>
            </div>

            <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
              <OrderDetailView order={selectedOrder} />
            </div>
          </div>
        ) : (
          /* Заглушка для Десктопа, когда ничего не выбрано */
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ArrowLeft className="w-8 h-8 md:hidden" /> {/* На мобильном стрелка влево не логична тут, но этот блок скрыт на мобильном */}
              <div className="hidden md:block w-8 h-1 bg-slate-300 rounded-full" />
            </div>
            <p className="text-lg font-medium text-slate-600">Выберите заказ для проверки</p>
            <p className="text-sm mt-2 max-w-xs text-center">
              Нажмите на родителя в списке слева, чтобы увидеть фотографии и детали заказа.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-[calc(100vh-65px)]">
      <div className="w-full md:w-[350px] border-r bg-white p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="hidden md:block flex-1 p-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function TeacherDashboardPage(props: PageProps) {
  // Убрал верхний заголовок H1, так как он занимает драгоценное место на мобильном.
  // Заголовок теперь внутри Navbar или внутри колонок.
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}