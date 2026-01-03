'use server';

import prisma from '@/lib/prisma';
import { PhotoFormat, getPrice } from '@/config/pricing';
import { revalidatePath } from 'next/cache';

/**
 * Get school and its classrooms by slug
 */
// Update the getSchoolAndClasses function to include isKazakhEnabled

export async function getSchoolAndClasses(slug: string) {
  try {
    const school = await prisma.school.findUnique({
      where: {
        slug,
        isActive: true,
        publicLinkEnabled: true,
      },
      include: {
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
            name:  'asc',
          },
        },
      },
    });

    if (!school) {
      return null;
    }

    return {
      id: school.id,
      name: school.name,
      slug: school.slug,
      primaryColor: school.primaryColor,
      logoUrl: school.logoUrl,
      isKazakhEnabled: school.isKazakhEnabled, // NEW
      classrooms: school.classrooms,
    };
  } catch (error) {
    console.error('Error fetching school:', error);
    throw new Error('Failed to load school information');
  }
}

/**
 * Get classroom photos
 */
export async function getClassroomPhotos(classId:  string) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classId,
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

    return {
      id: classroom.id,
      name: classroom.name,
      school: classroom.school,
      photos: classroom.photos,
    };
  } catch (error) {
    console.error('Error fetching classroom photos:', error);
    throw new Error('Failed to load photos');
  }
}

/**
 * Submit order
 */
// ... (начало файла без изменений)

export async function submitOrder(
    classId: string,
    parentDetails: {
      name: string;
      surname: string;
      email: string; // Мы принимаем email для валидации, но не сохраняем в Order (согласно схеме)
      phone: string;
    },
    cartItems: Array<{
      photoId: string;
      format: PhotoFormat;
      quantity: number;
    }>
  ): Promise<{ success?: boolean; orderId?: string; error?: string }> {
    
    // Validation
    if (!parentDetails.name || !parentDetails.surname) {
      return { error: 'Name and surname are required' };
    }
  
    // Email используем только для проверки на клиенте или отправки чека, 
    // но в БД Order его нет, поэтому валидацию оставляем, но сохранять не будем.
    if (parentDetails.email && !parentDetails.email.includes('@')) {
      return { error: 'Please enter a valid email address' };
    }
  
    if (cartItems.length === 0) {
      return { error: 'Cart is empty' };
    }
  
    try {
      // Verify classroom exists and is not locked
      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
        include: {
          school: {
            select: {
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
        const expectedPrice = getPrice(item.format);
        const itemTotal = expectedPrice * item.quantity;
        totalAmount += itemTotal;
  
        // Verify photo exists
        const photo = await prisma.photo.findUnique({
          where: { id: item.photoId },
        });
  
        if (!photo || photo.classId !== classId) {
          return { error: 'Invalid photo in cart' };
        }
  
        // Собираем данные для OrderItem согласно схеме
        validatedItems.push({
          photoId: item.photoId,
          format: item.format,
          quantity: item.quantity,
          price: expectedPrice,      // В схеме поле называется 'price'
          subtotal: itemTotal,       // В схеме поле называется 'subtotal'
          photoUrl: photo.watermarkedUrl // В схеме есть поле 'photoUrl' (snapshot)
        });
      }
  
      // Create order
      const order = await prisma.order.create({
        data: {
          classId,
          parentName: parentDetails.name,
          parentSurname: parentDetails.surname,
          // parentEmail: parentDetails.email, // УДАЛЕНО: этого поля нет в модели Order
          parentPhone: parentDetails.phone || null,
          status: 'PENDING',
          totalSum: totalAmount, // ИСПРАВЛЕНО: в схеме поле называется totalSum
          items: {
            create: validatedItems,
          },
        },
        include: {
          items: true,
        },
      });
  
      // Revalidate pages (опционально, если на странице класса меняется статус)
      // revalidatePath(`/s/${classroom.school}`); 
  
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