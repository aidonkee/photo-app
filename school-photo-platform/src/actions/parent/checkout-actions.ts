'use server';

import prisma from '@/lib/prisma';
import { PhotoFormat, getPrice } from '@/config/pricing';
import { revalidatePath } from 'next/cache';

type ParentDetails = {
  name: string;
  surname: string;
  email: string;
  phone?: string;
};

type CartItem = {
  photoId: string;
  format: PhotoFormat;
  quantity: number;
};

export async function submitOrderAction(
  classId: string,
  parentDetails: ParentDetails,
  cartItems: CartItem[]
): Promise<{ success?: boolean; orderId?: string; error?: string }> {
  // Validation
  if (!parentDetails.name || !parentDetails.surname || !parentDetails.email) {
    return { error: 'Name, surname, and email are required' };
  }

  if (!parentDetails.email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  if (cartItems.length === 0) {
    return { error: 'Cart is empty' };
  }

  try {
    // Verify classroom exists and is active
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: {
        school: {
          select: {
            id: true,
            isActive: true,
            publicLinkEnabled: true,
          },
        },
      },
    });

    if (!classroom || classroom.isLocked) {
      return { error: 'This classroom is no longer accepting orders' };
    }

    if (!classroom.school.isActive || !classroom.school.publicLinkEnabled) {
      return { error: 'School storefront is currently unavailable' };
    }

    // Validate prices server-side
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      // Get server-side price (prevent client manipulation)
      const expectedPrice = getPrice(item.format);
      const itemTotal = expectedPrice * item.quantity;
      totalAmount += itemTotal;

      // Verify photo exists and belongs to this classroom
      const photo = await prisma.photo.findUnique({
        where: { id: item.photoId },
      });

      if (!photo || photo.classId !== classId) {
        return { error: 'Invalid photo in cart' };
      }

      // Исправленная структура для OrderItem
      validatedItems.push({
        photoId: item.photoId,
        format: item.format,
        quantity: item.quantity,
        price: expectedPrice,      // В схеме это поле называется price
        subtotal: itemTotal,       // В схеме обязательно поле subtotal
        photoUrl: photo.watermarkedUrl // В схеме обязательно поле photoUrl (snapshot)
      });
    }

    // Create order with validated data
    const order = await prisma.order.create({
      data: {
        classId,
        parentName: parentDetails.name,
        parentSurname: parentDetails.surname,
        // parentEmail: parentDetails.email, // УДАЛЕНО: Этого поля нет в модели Order в schema.prisma
        parentPhone: parentDetails.phone || null,
        status: 'PENDING',
        totalSum: totalAmount, // ИСПРАВЛЕНО: totalAmount -> totalSum
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: true,
      },
    });

    // TODO: Send confirmation email to parent (using parentDetails.email)
    // await sendOrderConfirmationEmail(parentDetails.email, order);

    // Revalidate school page
    revalidatePath(`/s/${classroom.school.id}`);

    return {
      success: true,
      orderId: order.id,
    };
  } catch (error: any) {
    console.error('Error submitting order:', error);
    return {
      error: error.message || 'Failed to submit order. Please try again.',
    };
  }
}