'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/config/pricing';
import { Clock, CheckCircle, Package } from 'lucide-react';

type Order = {
  id: string;
  parentName: string;
  parentSurname: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
};

type MasterSummaryTableProps = {
  orders: Order[];
};

export default function MasterSummaryTable({ orders }: MasterSummaryTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'APPROVED_BY_TEACHER':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'LOCKED':
        return (
          <Badge className="bg-blue-600">
            <Package className="w-3 h-3 mr-1" />
            Locked
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const totalRevenue = orders. reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parent Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  No orders yet
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order. id}>
                  <TableCell className="font-medium">
                    {order.parentName} {order.parentSurname}
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(order. status)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatPrice(order.totalAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {orders.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <span className="font-semibold text-slate-900">Total Revenue: </span>
          <span className="text-2xl font-bold text-green-600">
            {formatPrice(totalRevenue)}
          </span>
        </div>
      )}
    </div>
  );
}