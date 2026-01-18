import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';

// Инициализируем Supabase Admin Client (с полными правами)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
    }

    // 2. Параметры
    const body = await request.json();
    const { orderId, schoolId } = body;

    if (!orderId && !schoolId) {
      return NextResponse.json({ error: 'orderId или schoolId обязателен' }, { status: 400 });
    }

    const zip = new JSZip();
    let orders: any[] = [];

    // 3. Получаем заказы
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          classroom: { include: { school: true } },
          items: {
            include: { photo: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (order) orders.push(order);
    } else if (schoolId) {
      orders = await prisma.order.findMany({
        where: { classroom: { schoolId: schoolId } },
        include: {
          classroom: { select: { id: true, name: true } },
          items: {
            include: { photo: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!orders.length) {
      return NextResponse.json({ error: 'Заказы не найдены' }, { status: 404 });
    }

    // 4. Группировка
    const ordersByClass: Record<string, any[]> = {};
    if (schoolId) {
      for (const order of orders) {
        const className = order.classroom.name;
        if (!ordersByClass[className]) ordersByClass[className] = [];
        ordersByClass[className].push(order);
      }
    } else {
      ordersByClass['Single_Order'] = orders;
    }

    // 5. Проходим по заказам и качаем фото с учётом количества и формата
    for (const [className, classOrders] of Object.entries(ordersByClass)) {
      const rootFolder = schoolId ? zip.folder(className) : zip;
      if (!rootFolder) continue;

      for (let orderIndex = 0; orderIndex < classOrders.length; orderIndex++) {
        const order = classOrders[orderIndex];

        const safeSurname = (order.parentSurname || 'Parent')
          .replace(/[^\w\sа-яА-ЯёЁ\-]/g, '')
          .trim();
        const safeOrderName = `Заказ_${String(orderIndex + 1).padStart(3, '0')}_${safeSurname}`;

        const orderFolder = rootFolder.folder(safeOrderName);
        if (!orderFolder) continue;

        const items = order.items || [];
        const downloadTasks = items.map(async (item: any, itemIndex: number) => {
          const formatFolder = orderFolder.folder(item.format || 'UNSPECIFIED');
          if (!formatFolder) return;

          try {
            let storagePath = item.photo?.originalUrl;
            if (!storagePath) {
              throw new Error('Отсутствует originalUrl у фото');
            }
            if (storagePath.includes('school-photos/')) {
              storagePath = storagePath.split('school-photos/')[1];
            }

            const { data, error } = await supabaseAdmin.storage
              .from('school-photos')
              .download(storagePath);

            if (error || !data) {
              throw new Error(error?.message || 'Не удалось скачать файл');
            }

            const arrayBuffer = await data.arrayBuffer();

            let extension = 'jpg';
            const lower = item.photo.originalUrl.toLowerCase();
            if (lower.endsWith('.png')) extension = 'png';
            if (lower.endsWith('.jpeg')) extension = 'jpeg';
            if (lower.endsWith('.webp')) extension = 'webp';

            // Дублируем в зависимости от количества
            const copies = Math.max(1, item.quantity || 1);
            for (let copyIndex = 1; copyIndex <= copies; copyIndex++) {
              const fileName = `photo-${String(itemIndex + 1).padStart(3, '0')}_copy${copyIndex}.${extension}`;
              formatFolder.file(fileName, arrayBuffer);
            }
          } catch (err: any) {
            console.error(`🔥 Ошибка скачивания ф��то OrderItem ${item.id}:`, err);
            formatFolder.file(
              `ERROR_item_${itemIndex + 1}.txt`,
              `OrderItem: ${item.id}\nPhotoId: ${item.photoId}\nПуть: ${item.photo?.originalUrl}\nОшибка: ${err.message}`
            );
          }
        });

        await Promise.all(downloadTasks);
      }
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = schoolId
      ? `school-orders-${schoolId.slice(0, 8)}.zip`
      : `order-${orderId?.slice(0, 8)}.zip`;

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GLOBAL ZIP ERROR:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}