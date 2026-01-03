'use client';
import { useTranslation } from '@/stores/language-store';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutInput } from '@/lib/validations';
import { useCartStore } from '@/stores/cart-store';
import { submitOrderAction as submitOrder } from '@/actions/parent/checkout-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

type CheckoutFormProps = {
  classId: string;
  schoolSlug: string;
};

export default function CheckoutForm({ classId, schoolSlug }: CheckoutFormProps) {
  
  
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React. useState<string | null>(null);
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

      const result = await submitOrder(classId, data, cartItems);

      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      clearCart();

      // Redirect after success
      setTimeout(() => {
        router.push(`/s/${schoolSlug}/success? orderId=${result.orderId}`);
      }, 2000);
    } catch (err:  any) {
      setError(err.message || 'Failed to submit order');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Order Placed Successfully!
          </h3>
          <p className="text-green-800">
            You will receive a confirmation email shortly. 
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                {... register('name')}
                placeholder="John"
                disabled={submitting}
                className="h-11"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname">Last Name *</Label>
              <Input
                id="surname"
                {...register('surname')}
                placeholder="Doe"
                disabled={submitting}
                className="h-11"
              />
              {errors.surname && (
                <p className="text-sm text-red-600">{errors.surname.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john. doe@example.com"
              disabled={submitting}
              className="h-11"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="text-xs text-slate-500">
              Order confirmation will be sent to this email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 000-0000"
              disabled={submitting}
              className="h-11"
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors. phone.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={submitting || items.length === 0}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Order...
              </span>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Place Order
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            By placing your order, you agree to our terms and conditions.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}