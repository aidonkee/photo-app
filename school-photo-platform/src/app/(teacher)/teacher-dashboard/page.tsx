import React, { Suspense } from 'react';
import { getTeacherOrders, getOrderById } from '@/actions/teacher/order-actions';
import ParentOrdersList from '@/components/teacher/ParentOrdersList';
import OrderDetailView from '@/components/teacher/OrderDetailView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Панель учителя - Проверка заказов',
  description: 'Просмотр и проверка заказов родителей на фотографии',
};

type PageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

async function DashboardContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const orders = await getTeacherOrders();
  
  // Get selected order or default to first order
  const selectedOrderId = params.orderId || (orders.length > 0 ?  orders[0].id : null);
  const selectedOrder = selectedOrderId ? await getOrderById(selectedOrderId) : null;

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
      {/* Left Sidebar - Parent List */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 h-full overflow-hidden rounded-lg shadow-lg">
        <ParentOrdersList orders={orders} />
      </div>

      {/* Right Panel - Order Details */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 h-full overflow-y-auto">
        <OrderDetailView order={selectedOrder} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
      <div className="col-span-12 lg:col-span-4 xl:col-span-3">
        <Card className="h-full">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="col-span-12 lg:col-span-8 xl:col-span-9">
        <Card className="h-full">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TeacherDashboardPage(props: PageProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Проверка заказов
        </h1>
        <p className="text-slate-600 mt-2">
          Просматривайте заказы родителей и сообщайте о любых проблемах с фотографиями
        </p>
      </div>

      {/* Master-Detail Layout */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}