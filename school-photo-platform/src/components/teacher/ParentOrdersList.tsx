'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  Clock,
  CheckCircle,
  Package,
  ChevronRight,
  User
} from 'lucide-react';
import type { TeacherOrder } from '@/actions/teacher/order-actions';

type ParentOrdersListProps = {
  orders: TeacherOrder[];
};

export default function ParentOrdersList({ orders }: ParentOrdersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get('orderId');
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOrders = orders.filter((order) => {
    const fullName = `${order.parentName} ${order.parentSurname}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleSelectOrder = (orderId: string) => {
    router.push(`/teacher-dashboard?orderId=${orderId}`);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return { icon: <Clock className="w-4 h-4 text-amber-600" />, text: 'Ожидает', color: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'APPROVED_BY_TEACHER':
        return { icon: <CheckCircle className="w-4 h-4 text-green-600" />, text: 'Одобрено', color: 'bg-green-50 text-green-700 border-green-100' };
      case 'LOCKED':
        return { icon: <Package className="w-4 h-4 text-slate-500" />, text: 'В печати', color: 'bg-slate-50 text-slate-600 border-slate-200' };
      default:
        return { icon: <Clock className="w-4 h-4" />, text: status, color: 'bg-slate-50' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Поиск */}
      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по фамилии..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base bg-slate-50 border-slate-200 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-900 font-medium">Список пуст</p>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm ? 'Ничего не найдено по запросу' : 'Родители еще не сделали заказов'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = getStatusInfo(order.status);
            const isSelected = selectedOrderId === order.id;

            return (
              <Card
                key={order.id}
                onClick={() => handleSelectOrder(order.id)}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-200 border
                  ${isSelected 
                    ? 'border-slate-900 shadow-md bg-slate-50' 
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                  }
                `}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Аватар с инициалами */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                      ${isSelected ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}
                    `}>
                      {order.parentSurname.charAt(0)}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-base leading-tight">
                        {order.parentSurname} {order.parentName}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                         {/* Статус бейдж */}
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.icon}
                          {status.text}
                        </div>
                        <span className="text-xs text-slate-400">
                           • {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Стрелочка для мобильных, чтобы показать кликабельность */}
                  <ChevronRight className={`w-5 h-5 text-slate-300 ${isSelected ? 'text-slate-900' : ''}`} />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}