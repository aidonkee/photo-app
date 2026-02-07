import { Suspense } from 'react';
import Link from 'next/link';
import { getTeacherOrders, getOrderById } from '@/actions/teacher/order-actions';
import TeacherOrdersTable from '@/components/teacher/TeacherOrdersTable';
import OrderDetailView from '@/components/teacher/OrderDetailView';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
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

  const selectedOrderId = params.orderId;
  const selectedOrder = selectedOrderId
    ? await getOrderById(selectedOrderId)
    : orders.length > 0
      ? await getOrderById(orders[0].id)
      : null;

  const hasSelection = !!selectedOrderId;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSelection ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Заказы класса
              </h1>
              <p className="text-slate-500 font-medium">
                Проверяйте заказы родителей и отмечайте оплату
              </p>
            </div>

            <TeacherOrdersTable orders={orders} />
          </div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            <div className="bg-white border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
              <Link href="/teacher-dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 font-bold">
                  <ArrowLeft className="w-4 h-4" />
                  Назад к списку
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Проверка заказа:</span>
                <span className="text-sm font-extrabold text-slate-900">{selectedOrder.parentSurname} {selectedOrder.parentName}</span>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <OrderDetailView order={selectedOrder} canEdit={selectedOrder.canEdit ?? false} />
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400">
            <p className="text-lg font-medium text-slate-600">Заказ не найден</p>
            <Link href="/teacher-dashboard" className="mt-4">
              <Button variant="outline">Вернуться к списку</Button>
            </Link>
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
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}
