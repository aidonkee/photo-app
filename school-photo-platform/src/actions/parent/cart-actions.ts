'use server';

import prisma from '@/lib/prisma';
import { PhotoFormat, getPrice } from '@/config/pricing';
import { revalidatePath } from 'next/cache';

/**
 * Get school and its classrooms by slug (WITH PRICING)
 */
export async function getSchoolAndClasses(slug: string) {
  try {
    const school = await prisma.school. findUnique({
      where:  {
        slug,
        isActive: true,
        publicLinkEnabled: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor:   true,
        logoUrl: true,
        isKazakhEnabled: true,
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
 * Распределяет фотки по колонкам для masonry layout
 * Сохраняет горизонтальную нумерацию (1,2,3,4 в первом ряду и т.д.)
 */
function distributeToColumns<T extends { width: number; height: number }>(
  photos: T[],
  columnCount: number
): { columns: T[][]; photoIndexMap: Map<string, number> } {
  // Создаём колонки
  const columns: T[][] = Array. from({ length: columnCount }, () => []);
  const columnHeights: number[] = Array(columnCount).fill(0);
  
  // Карта для хранения оригинального индекса каждой фотки
  const photoIndexMap = new Map<string, number>();
  
  // Распределяем фотки по колонкам, добавляя в самую короткую
  photos.forEach((photo, index) => {
    // Находим самую короткую колонку
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    
    // Добавляем фото в эту колонку
    columns[shortestColumnIndex].push(photo);
    
    // Сохраняем оригинальный индекс (для нумерации)
    photoIndexMap.set((photo as any).id, index);
    
    // Обновляем высоту колонки (используем aspect ratio)
    const aspectRatio = photo.width / photo.height;
    columnHeights[shortestColumnIndex] += 1 / aspectRatio;
  });
  
  return { columns, photoIndexMap };
}

/**
 * Get classroom photos (WITH SCHOOL PRICING + COLUMNS DISTRIBUTION)
 */
export async function getClassroomPhotos(classId: string) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: {
        id:   classId,
        isLocked: false,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor:  true,
            isActive: true,
            publicLinkEnabled: true,
            priceA4: true,
            priceA5: true,
          },
        },
        photos: {
          select: {
            id: true,
            originalUrl: true,
            watermarkedUrl: true,
            thumbnailUrl: true,
            alt: true,
            width: true,
            height: true,
            uploadedAt: true, // ✅ Добавляем дату загрузки
          },
          orderBy: {
            uploadedAt: 'asc', // ✅ Сортируем по дате загрузки (старые первые = порядок загрузки)
          },
        },
      },
    });

    if (!classroom || !classroom.school. isActive || !classroom.school.publicLinkEnabled) {
      return null;
    }

    // ✅ Распределяем фотки по 4 колонкам для masonry
    const { columns, photoIndexMap } = distributeToColumns(classroom.photos, 4);

    return {
      ...classroom,
      // Оригинальный массив фоток (для модалки и навигации)
      photos: classroom.photos,
      // Распределённые по колонкам фотки (для masonry grid)
      photoColumns: columns,
      // Карта индексов для нумерации
      photoIndexMap:  Object.fromEntries(photoIndexMap),
    };
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
    quantity:   number;
  }>
): Promise<{ success? :   boolean; orderId?: string; error?: string }> {
  
  // Validation
  if (!parentDetails.name || !parentDetails.  surname) {
    return { error: 'Name and surname are required' };
  }

  if (parentDetails.email && !  parentDetails.email.includes('@')) {
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
            id:   true,
            isActive: true,
            publicLinkEnabled: true,
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
      const expectedPrice = getPrice(item.format, schoolPricing);
      const itemTotal = expectedPrice * item.quantity;
      totalAmount += itemTotal;

      // Verify photo exists
      const photo = await prisma.photo.findUnique({
        where: { id:  item.photoId },
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
        parentName: parentDetails. name,
        parentSurname: parentDetails.  surname,
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

    revalidatePath(`/s/${classroom.school.id}`);

    return {
      success: true,
      orderId: order.  id,
    };
  } catch (error:   any) {
    console.error('Error submitting order:', error);
    return {
      error: error.message || 'Failed to submit order.  Please try again.',
    };
  }
}