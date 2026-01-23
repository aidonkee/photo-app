'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutInput } from '@/lib/validations';
import { useCartStore } from '@/stores/cart-store';
import { useTranslation } from '@/stores/language-store';
import { submitOrderAction as submitOrder } from '@/actions/parent/checkout-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, User } from 'lucide-react';
import { formatPrice } from '@/config/pricing';

type CheckoutFormProps = {
  classId: string;
  schoolSlug: string;
};

export default function CheckoutForm({ classId, schoolSlug }: CheckoutFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const cartItems = items.map((item) => ({
        photoId: item.photoId,
        format: item.format,
        quantity: item.quantity,
      }));

      const result = await submitOrder(classId, {
        ...data,
        surname: '-',
      } as any, cartItems);

      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      clearCart();

      setTimeout(() => {
        router.push(`/s/${schoolSlug}/success?orderId=${result.orderId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('order_error'));
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('order_success')}</h3>
        <p className="text-slate-500 text-sm">{t('order_redirecting')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-10">
      <div className="space-y-4">
        {/* Student Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-700 ml-1">
            {t('student_name')} *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <Input
              id="name"
              {...register('name')}
              placeholder={t('student_name_placeholder')}
              disabled={submitting}
              className="h-12 pl-10 rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900 transition-all text-base"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 ml-1">
            {t('phone_optional')}
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder={t('phone_placeholder')}
            disabled={submitting}
            className="h-12 rounded-xl border-slate-200 text-base"
          />
          {errors.phone && (
            <p className="text-xs text-red-500 ml-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-400 ml-1">
            {t('email_optional')}
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder={t('email_placeholder')}
            disabled={submitting}
            className="h-12 rounded-xl border-slate-200 text-base placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400 ml-1">
            {t('email_hint')}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl bg-red-50 border-red-100 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={submitting || items.length === 0}
        className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all active:scale-[0.98] mt-4"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('processing')}
          </span>
        ) : (
          <>
            {t('pay')} {formatPrice(totalPrice)}
          </>
        )}
      </Button>

      <p className="text-[10px] text-slate-400 text-center px-4">
        {t('terms_agreement')}
      </p>
    </form>
  );
}