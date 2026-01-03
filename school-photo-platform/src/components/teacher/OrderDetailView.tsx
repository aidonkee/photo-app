'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RequestEditDialog from './RequestEditDialog';
import {
  Image,
  Package,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { TeacherOrder } from '@/actions/teacher/order-actions';

type OrderDetailViewProps = {
  order: TeacherOrder | null;
};

export default function OrderDetailView({ order }: OrderDetailViewProps) {
  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Image className="w-24 h-24 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Order Selected
          </h3>
          <p className="text-slate-600">
            Select a parent from the list on the left to view their order details
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    // Используем 'ru-KZ' или 'ru-RU', чтобы получить символ ₸ и правильный формат (1 000)
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT', // <--- БЫЛО 'TG', СТАЛО 'KZT'
      maximumFractionDigits: 0, // Убираем копейки (обычно не нужны)
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            Pending Review
          </Badge>
        );
      case 'APPROVED_BY_TEACHER':
        return (
          <Badge className="bg-slate-900">
            Approved
          </Badge>
        );
      case 'LOCKED':
        return (
          <Badge className="bg-slate-900">
            Locked for Printing
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-slate-900">
            Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormatLabel = (format: string) => {
    const labels:  Record<string, string> = {
      A4: 'A4 Print (8.3" × 11.7")',
      A5: 'A5 Print (5.8" × 8.3")',
    };
    return labels[format] || format;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Order from {order.parentName} {order.parentSurname}
          </h2>
          <p className="text-slate-600 mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <RequestEditDialog
            parentName={`${order.parentName} ${order.parentSurname}`}
          />
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">
                  {order.items. reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Order Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Image className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Photos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {order.items.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Order Date</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parent Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parent Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           
            {order.parentPhone && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-900">
                    {order.parentPhone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Review carefully:</strong> Check if all photos are correct before approving. 
          If you notice any issues (wrong student, bad crop, etc.), click "Report Issue" above.
        </AlertDescription>
      </Alert>

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ordered Photos ({order.items.length})</CardTitle>
            <Alert className="bg-slate-50 border-slate-200 py-2 px-3">
              <Info className="h-3 w-3 text-slate-900" />
              <AlertDescription className="text-xs text-slate-700 ml-2">
                Watermarks will be removed on prints
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={item.id}
                className="border-2 border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Photo Preview */}
                  <div className="w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                    <Image className="w-12 h-12 text-slate-400" />
                    {/* In production, display actual photo */}
                  </div>

                  {/* Photo Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-lg">
                          Photo #{index + 1}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {item.photo.alt || 'Untitled'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.quantity}x {getFormatLabel(item.format)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="text-sm">
                        <span className="text-slate-500">Format:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {getFormatLabel(item.format)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Quantity:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Price per unit:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {formatCurrency(item.pricePerUnit)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="ml-2 font-bold text-slate-900">
                          {formatCurrency(item.pricePerUnit * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">
                Order Total: 
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}