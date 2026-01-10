'use server';

import prisma from '@/lib/prisma';
import { PhotoFormat, getPrice } from '@/config/pricing';
import { revalidatePath } from 'next/cache';

/**
 * Get school and its classrooms by slug (WITH PRICING)
 */
export async function getSchoolAndClasses(slug: string) {
  try {
    const school = await prisma.school.findUnique({
      where: {
        slug,
        isActive: true,
        publicLinkEnabled: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor:  true,
        logoUrl: true,
        isKazakhEnabled: true,
        // 🆕 Include pricing
        priceA4: true,
        priceA5: true,
        classrooms: {
          where: {
            isLocked: false,
          },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                photos: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!school) {
      return null;
    }

    return school;
  } catch (error) {
    console.error('Error fetching school:', error);
    throw new Error('Failed to load school information');
  }
}

/**
 * Get classroom photos (WITH SCHOOL PRICING)
 */
export async function getClassroomPhotos(classId: string) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: {
        id:  classId,
        isLocked: false,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true,
            isActive: true,
            publicLinkEnabled: true,
            // 🆕 Include pricing for PhotoModal
            priceA4: true,
            priceA5: true,
           
           
          },
        },
        photos: {
          select: {
            id: true,
            watermarkedUrl: true,
            thumbnailUrl: true,
            alt: true,
            width: true,
            height: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!classroom || !classroom.school. isActive || !classroom.school.publicLinkEnabled) {
      return null;
    }

    return classroom;
  } catch (error) {
    console.error('Error fetching classroom photos:', error);
    throw new Error('Failed to load photos');
  }
}

/**
 * Submit order (WITH DYNAMIC PRICING)
 */
export async function submitOrder(
  classId: string,
  parentDetails: {
    name: string;
    surname: string;
    email: string;
    phone: string;
  },
  cartItems: Array<{
    photoId: string;
    format: PhotoFormat;
    quantity:  number;
  }>
): Promise<{ success?:  boolean; orderId?: string; error?: string }> {
  
  // Validation
  if (!parentDetails.name || !parentDetails. surname) {
    return { error: 'Name and surname are required' };
  }

  if (parentDetails.email && ! parentDetails.email.includes('@')) {
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
        school: {
          select: {
            id:  true,
            isActive: true,
            publicLinkEnabled: true,
            // 🆕 Get pricing for server-side validation
            priceA4: true,
            priceA5: true,
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

    // Create schoolPricing object for getPrice function
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

      // Verify photo exists
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

    // Create order
    const order = await prisma.order.create({
      data: {
        classId,
        parentName: parentDetails.name,
        parentSurname: parentDetails. surname,
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

    // TODO: Send confirmation email to parent
    // await sendOrderConfirmationEmail(parentDetails.email, order);

    revalidatePath(`/s/${classroom.school.id}`);

    return {
      success: true,
      orderId: order. id,
    };
  } catch (error:  any) {
    console.error('Error submitting order:', error);
    return {
      error: error.message || 'Failed to submit order. Please try again.',
    };
  }
}