import React from 'react';
import { getSchoolOrders } from '@/actions/admin/order-actions';
import { getSchoolById } from '@/actions/admin/school-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminOrdersTable from '@/components/admin/AdminOrdersTable';

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default async function AdminSchoolOrdersPage({ params }: PageProps) {
  const { schoolId } = await params;
  const [school, orders] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolOrders(schoolId),
  ]);

  // Serialize dates for client component
  const serializedOrders = orders.map(order => ({
    ...order,
    totalSum: Number(order.totalSum),
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/admin/schools/${schoolId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <AdminOrdersTable
        orders={serializedOrders as any}
        schoolId={schoolId}
        schoolName={school.name}
      />
    </div>
  );
}