'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { OrderStatus, PhotoFormat } from '@prisma/client';

async function requireHeadTeacherAuth() {
    const session = await getSession();
    if (!session || session.role !== 'HEAD_TEACHER' || !session.schoolId) {
        throw new Error('Unauthorized');
    }
    return session.schoolId;
}

export async function getSchoolOrders(filters?: { classId?: string, search?: string }) {
    const schoolId = await requireHeadTeacherAuth();

    const whereClause: any = {
        classroom: { schoolId },
    };

    if (filters?.classId) {
        whereClause.classId = filters.classId;
    }

    if (filters?.search) {
        whereClause.OR = [
            { parentName: { contains: filters.search, mode: 'insensitive' } },
            { parentSurname: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
            classroom: {
                select: { name: true }
            },
            items: {
                include: { photo: true }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    // Serialize Decimal to number to avoid Next.js Server-to-Client hydration errors
    return orders.map(order => ({
        ...order,
        totalSum: Number(order.totalSum),
        items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
            subtotal: Number(item.subtotal),
        }))
    }));
}

export async function updateOrderItemsByHeadTeacher(
    orderId: string,
    itemsToUpdate: { id: string, format: PhotoFormat, quantity: number }[]
) {
    const schoolId = await requireHeadTeacherAuth();

    // Verify order belongs to school
    const order = await prisma.order.findFirst({
        where: { id: orderId, classroom: { schoolId } },
        include: { items: true, classroom: { include: { school: true } } }
    });

    if (!order) throw new Error('Order not found or access denied');

    const school = order.classroom.school;

    // Perform updates in a transaction
    await prisma.$transaction(async (tx) => {
        let totalSum = 0;

        for (const updateItem of itemsToUpdate) {
            const existingItem = order.items.find(i => i.id === updateItem.id);
            if (!existingItem) {
                // In this simple implementation we don't handle adding completely new photo items,
                // but we could if needed. We assume modifying existing ones here.
                continue;
            }

            const price = updateItem.format === 'A4' ? school.priceA4 : school.priceA5;
            const subtotal = price * updateItem.quantity;
            totalSum += subtotal;

            await tx.orderItem.update({
                where: { id: updateItem.id },
                data: {
                    format: updateItem.format,
                    quantity: updateItem.quantity,
                    price,
                    subtotal
                }
            });
        }

        // Also add logic to delete items that are missing from itemsToUpdate if needed
        // For simplicity, assuming the client passes all existing items

        await tx.order.update({
            where: { id: orderId },
            data: {
                totalSum,
                moderatedByRole: 'HEAD_TEACHER',
                moderatedAt: new Date(),
            }
        });
    });

    revalidatePath('/head-teacher/orders');
    return { success: true };
}

export async function deleteOrderByHeadTeacher(orderId: string) {
    const schoolId = await requireHeadTeacherAuth();

    const order = await prisma.order.findFirst({
        where: { id: orderId, classroom: { schoolId } }
    });

    if (!order) throw new Error('Order not found');

    await prisma.order.delete({
        where: { id: orderId }
    });

    revalidatePath('/head-teacher/orders');
    return { success: true };
}

export async function updateOrderStatusByHeadTeacher(orderId: string, status: OrderStatus) {
    const schoolId = await requireHeadTeacherAuth();

    const order = await prisma.order.findFirst({
        where: { id: orderId, classroom: { schoolId } }
    });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
        where: { id: orderId },
        data: {
            status,
            moderatedByRole: 'HEAD_TEACHER',
            moderatedAt: new Date(),
        }
    });

    revalidatePath('/head-teacher/orders');
    return { success: true };
}
