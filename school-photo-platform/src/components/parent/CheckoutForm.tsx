'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutInput } from '@/lib/validations';
import { useCartStore } from '@/stores/cart-store';
import { submitOrderAction as submitOrder } from '@/actions/parent/checkout-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, CreditCard, User } from 'lucide-react';
import { formatPrice } from '@/config/pricing';

type CheckoutFormProps = {
  classId: string;
  schoolSlug: string;
};

export default function CheckoutForm({ classId, schoolSlug }: CheckoutFormProps) {
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

      // name — в схеме теперь будет содержать полное ФИО ученика
      const result = await submitOrder(classId, {
        ...data,
        surname: '-', // Заглушка, так как мы объединили поля
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
      setError(err.message || 'Ошибка при оформлении заказа');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Заказ успешно создан!</h3>
        <p className="text-slate-500 text-sm">Перенаправляем вас на страницу статуса...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-10">
      <div className="space-y-4">
        {/* ФИО УЧЕНИКА */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-700 ml-1">
            Фамилия и Имя (ученика) *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <Input
              id="name"
              {...register('name')}
              placeholder="Иванов Алексей"
              disabled={submitting}
              className="h-12 pl-10 rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900 transition-all text-base"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>
          )}
        </div>

        {/* ТЕЛЕФОН */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 ml-1">
            Номер телефона (необязательно)
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="+7 (___) ___-__-__"
            disabled={submitting}
            className="h-12 rounded-xl border-slate-200 text-base"
          />
          {errors.phone && (
            <p className="text-xs text-red-500 ml-1">{errors.phone.message}</p>
          )}
        </div>

        {/* EMAIL (НЕОБЯЗАТЕЛЬНО) */}
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-400 ml-1">
            Email (необязательно)
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="example@mail.ru"
            disabled={submitting}
            className="h-12 rounded-xl border-slate-200 text-base placeholder:text-slate-300"
          />
<<<<<<< HEAD
<<<<<<< HEAD
          <p className="text-[10px] text-slate-400 ml-1">
            Для получения чека и уведомлений о готовности
          </p>
=======
       
>>>>>>> da80273f9e7d10d1e0ec5315d15d11e63417c028
=======
       
>>>>>>> da80273f9e7d10d1e0ec5315d15d11e63417c028
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
            Оформляем...
          </span>
        ) : (
          <>
            Оплатить {formatPrice(totalPrice)}
          </>
        )}
      </Button>

<<<<<<< HEAD
<<<<<<< HEAD
      <p className="text-[10px] text-slate-400 text-center px-4">
        Нажимая кнопку, вы соглашаетесь с правилами сервиса и обработкой персональных данных.
      </p>
=======
     
>>>>>>> da80273f9e7d10d1e0ec5315d15d11e63417c028
=======
     
>>>>>>> da80273f9e7d10d1e0ec5315d15d11e63417c028
    </form>
  );
}