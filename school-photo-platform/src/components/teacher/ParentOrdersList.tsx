'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  User,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  Package,
} from 'lucide-react';
import type { TeacherOrder } from '@/actions/teacher/order-actions';

type ParentOrdersListProps = {
  orders:  TeacherOrder[];
};

export default function ParentOrdersList({ orders }: ParentOrdersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get('orderId');
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOrders = orders.filter((order) => {
    const fullName = `${order.parentName} ${order.parentSurname}`.toLowerCase();
    return fullName.includes(searchTerm. toLowerCase());
  });

  const handleSelectOrder = (orderId: string) => {
    router.push(`/teacher-dashboard? orderId=${orderId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'APPROVED_BY_TEACHER':
        return <CheckCircle className="w-4 h-4 text-slate-900" />;
      case 'LOCKED':
        return <Package className="w-4 h-4 text-slate-900" />;
      default:
        return <ShoppingCart className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'APPROVED_BY_TEACHER':
        return 'bg-slate-100 text-slate-800';
      case 'LOCKED': 
        return 'bg-slate-100 text-slate-800';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-slate-900" />
          Parent Orders
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="mt-3 text-sm text-slate-600">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">
              {searchTerm ? 'No orders found' : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedOrderId === order.id
                    ? 'ring-2 ring-slate-500 bg-slate-50'
                    : 'hover:border-slate-300'
                }`}
                onClick={() => handleSelectOrder(order.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-900 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {order.parentName. charAt(0)}
                          {order.parentSurname.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">
                          {order.parentName} {order.parentSurname. charAt(0)}. 
                        </h3>
                        <p className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(order.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(order.status)} w-full justify-center`}
                    >
                      {order.status === 'PENDING' && 'Pending'}
                      {order.status === 'APPROVED_BY_TEACHER' && 'Approved'}
                      {order.status === 'LOCKED' && 'Locked'}
                      {order.status === 'COMPLETED' && 'Completed'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">Pending</p>
            <p className="text-lg font-bold text-amber-600">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">Approved</p>
            <p className="text-lg font-bold text-slate-900">
              {orders.filter((o) => o.status === 'APPROVED_BY_TEACHER').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}