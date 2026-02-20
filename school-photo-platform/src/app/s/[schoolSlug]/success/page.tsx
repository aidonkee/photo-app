'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home } from 'lucide-react';

export default function OrderSuccessPage({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = React.use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-green-100 shadow-xl">
        <CardContent className="pt-12 pb-8 px-6 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-slate-900" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Заказ принят!
            </h1>
            <p className="text-lg font-medium text-slate-800 leading-relaxed">
              Ваши фотографии отправлены на печать.
            </p>
            <p className="text-slate-600 mt-2">
              Сдайте деньги учителю или ответственному за сбор денег.
            </p>
            {orderId && (
              <p className="text-xs text-slate-400 mt-6 font-mono bg-slate-100 py-1 px-2 rounded inline-block">
                ID: {orderId.slice(0, 8)}
              </p>
            )}
          </div>

          <Link href={`/s/${schoolSlug}`} className="block">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 gap-2">
              <Home className="w-4 h-4" />
              Вернуться в галерею
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}