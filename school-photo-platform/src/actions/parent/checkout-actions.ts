'use server';

import prisma from '@/lib/prisma';
import { PhotoFormat, getPrice } from '@/config/pricing';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/* ============================
   ZOD SCHEMA (SERVER-SIDE)
============================ */

const submitOrderSchema = z.object({
  classId: z.string().uuid(),
  parentDetails: z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.string().email().or(z.literal('')).optional(),
    phone: z.string().optional(),
  }),
  cartItems: z
    .array(
      z.object({
        photoId: z.string().uuid(),
        format: z.nativeEnum(PhotoFormat),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1),
});

/* ============================
   SERVER ACTION
============================ */

export async function submitOrderAction(
  classId: string,
  parentDetails: unknown,
  cartItems: unknown
): Promise<{ success?: boolean; orderId?: string; error?: string }> {
  /* ============================
     🔒 ZOD VALIDATION (CRITICAL)
  ============================ */

  const parsed = submitOrderSchema.safeParse({
    classId,
    parentDetails,
    cartItems,
  });

  if (!parsed.success) {
    const flatErrors = parsed.error.flatten();
    console.error('Zod validation error:', JSON.stringify(flatErrors, null, 2));

    // Surface specific field errors for debugging
    const fieldErrors = flatErrors.fieldErrors;

    // Check for format-specific errors
    if (fieldErrors.cartItems) {
      const formatIssue = parsed.error.issues.find(
        (issue) => issue.path.includes('format')
      );
      if (formatIssue) {
        console.error('Format validation failed:', formatIssue);
        return { error: `Недопустимый формат фото. Пожалуйста, очистите корзину и добавьте фото заново.` };
      }
    }

    if (fieldErrors.parentDetails) {
      return { error: 'Пожалуйста, заполните все обязательные поля (ФИО)' };
    }

    return { error: 'Некорректные данные заказа. Попробуйте очистить корзину и оформить заново.' };
  }

  const {
    parentDetails: validatedParent,
    cartItems: validatedCart,
  } = parsed.data;

  try {
    /* ============================
       VERIFY CLASSROOM + SCHOOL
    ============================ */

    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: {
        school: {
          select: {
            id: true,
            isActive: true,
            publicLinkEnabled: true,
            priceA4: true,
            priceA5: true,
          },
        },
      },
    });

    if (!classroom || classroom.isLocked) {
      return { error: 'Этот класс больше не принимает заказы' };
    }

    if (!classroom.school.isActive || !classroom.school.publicLinkEnabled) {
      return { error: 'Витрина школы временно недоступна' };
    }

    /* ============================
       SERVER-SIDE PRICING
    ============================ */

    const schoolPricing = {
      priceA4: classroom.school.priceA4,
      priceA5: classroom.school.priceA5,
    };

    /* ============================
       VALIDATE CART (NO TRUST)
    ============================ */

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of validatedCart) {
      const expectedPrice = getPrice(item.format, schoolPricing);
      const itemTotal = expectedPrice * item.quantity;
      totalAmount += itemTotal;

      const photo = await prisma.photo.findUnique({
        where: { id: item.photoId },
      });

      if (!photo || photo.classId !== classId) {
        return { error: 'Некорректная фотография в корзине' };
      }

      validatedItems.push({
        photo: { connect: { id: item.photoId } },
        format: item.format,
        quantity: item.quantity,
        price: expectedPrice,
        subtotal: itemTotal,
        photoUrl: photo.watermarkedUrl,
      });
    }

    /* ============================
       CREATE ORDER
    ============================ */

    const order = await prisma.order.create({
      data: {
        classId,
        parentName: validatedParent.name,
        parentSurname: validatedParent.surname,
        parentPhone: validatedParent.phone || null,
        status: 'PENDING',
        totalSum: totalAmount,
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath(`/s/${classroom.school.id}`);

    return {
      success: true,
      orderId: order.id,
    };
  } catch (error: any) {
    console.error('Error submitting order:', error);
    return {
      error: error.message || 'Не удалось оформить заказ. Попробуйте ещё раз.',
    };
  }
}
