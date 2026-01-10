'use server';

import prisma from '@/lib/prisma';
import { PhotoFormat, getPrice } from '@/config/pricing';
import { revalidatePath } from 'next/cache';

type ParentDetails = {
  name: string;
  surname: string;
  email: string;
  phone?:  string;
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
  if (!parentDetails.name || ! parentDetails.surname || !parentDetails.email) {
    return { error: 'Name, surname, and email are required' };
  }

  if (! parentDetails.email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  if (cartItems.length === 0) {
    return { error: 'Cart is empty' };
  }

  try {
    // Verify classroom exists and GET SCHOOL PRICING
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
      include: {
        school:  {
          select: {
            id: true,
            isActive: true,
            publicLinkEnabled: true,
            // 🆕 Get pricing
            priceA4: true,
            priceA5: true,
          },
        },
      },
    });

    if (!classroom || classroom. isLocked) {
      return { error: 'This classroom is no longer accepting orders' };
    }

    if (!classroom.school.isActive || !classroom.school.publicLinkEnabled) {
      return { error: 'School storefront is currently unavailable' };
    }

    // Create schoolPricing object
    const schoolPricing = {
      priceA4: classroom.school.priceA4,
      priceA5: classroom.school.priceA5,
    };

    // Validate prices server-side with SCHOOL PRICING
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      // 🆕 Use school-specific pricing
      const expectedPrice = getPrice(item.format, schoolPricing);
      const itemTotal = expectedPrice * item.quantity;
      totalAmount += itemTotal;

      // Verify photo exists and belongs to this classroom
      const photo = await prisma.photo.findUnique({
        where: { id: item.photoId },
      });

      if (!photo || photo.classId !== classId) {
        return { error: 'Invalid photo in cart' };
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

    // Create order with validated data
    const order = await prisma.order.create({
      data: {
        classId,
        parentName: parentDetails.name,
        parentSurname:  parentDetails.surname,
        parentPhone: parentDetails.phone || null,
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

    // TODO: Send confirmation email
    // await sendOrderConfirmationEmail(parentDetails.email, order);

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