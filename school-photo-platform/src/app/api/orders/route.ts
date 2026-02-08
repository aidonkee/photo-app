import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Build where clause based on role
    let whereClause: any = {};

    if (session.role === 'TEACHER') {
      // Teachers can only see their classroom's orders
      if (!session.classId) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 400 }
        );
      }
      whereClause.classId = session.classId;
    } else if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') {
      // Admins can filter by classId or see all their orders
      if (classId) {
        // Verify they own this classroom (SUPER_ADMIN can access any)
        const classroom = await prisma.classroom.findUnique({
          where: { id: classId },
          include: { school: true },
        });

        if (!classroom) {
          return NextResponse.json(
            { error: 'Classroom not found' },
            { status: 404 }
          );
        }

        // SUPER_ADMIN can access any classroom; ADMIN must own it
        if (session.role === 'ADMIN' && classroom.school.adminId !== session.userId) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        whereClause.classId = classId;
      } else {
        // SUPER_ADMIN sees all orders; ADMIN sees only their schools' orders
        if (session.role === 'SUPER_ADMIN') {
          // No filter - see all
        } else {
          whereClause.classroom = {
            school: {
              adminId: session.userId,
            },
          };
        }
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        classroom: {
          include: {
            school: true,
          },
        },
        items: {
          include: {
            photo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}