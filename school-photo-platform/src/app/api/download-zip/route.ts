import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';

// ✅ ВАЖНО: фиксируем Node runtime (не Edge), иначе blob/Buffer/zip часто ведут себя плохо
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Если ты на Vercel и у тебя Next это поддерживает — можешь увеличить лимит
// export const maxDuration = 60;

// Инициализируем Supabase Admin Client (с полными правами)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizeFolderName(name: string) {
  return (name || 'Untitled')
    .replace(/[^\w\sа-яА-ЯёЁ\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function getExtFromUrl(url: string) {
  const lower = (url || '').toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.jpeg')) return 'jpeg';
  if (lower.endsWith('.webp')) return 'webp';
  if (lower.endsWith('.jpg')) return 'jpg';
  return 'jpg';
}

function extractStoragePath(originalUrl: string) {
  // originalUrl может быть:
  // - полным публичным URL
  // - путем вида "school-photos/...."
  // - путем внутри бакета
  let storagePath = originalUrl;

  // если это URL, вытащим pathname
  try {
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      const u = new URL(storagePath);
      storagePath = u.pathname;
    }
  } catch {
    // ignore
  }

  // уберём ведущие слэши
  storagePath = storagePath.replace(/^\/+/, '');

  // если путь содержит "school-photos/" — отрежем префикс
  const marker = 'school-photos/';
  if (storagePath.includes(marker)) {
    storagePath = storagePath.split(marker)[1];
  }

  return storagePath;
}

export async function POST(request: NextRequest) {
  try {
    // 1) Проверка авторизации
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
    }

    // 2) Параметры
    const body = await request.json();
    const { orderId, schoolId } = body as { orderId?: string; schoolId?: string };

    if (!orderId && !schoolId) {
      return NextResponse.json({ error: 'orderId или schoolId обязателен' }, { status: 400 });
    }

    const zip = new JSZip();
    let orders: any[] = [];

    // 3) Получаем заказы
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
        where: { classroom: { schoolId } },
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

    // 4) Группировка
    const ordersByClass: Record<string, any[]> = {};
    if (schoolId) {
      for (const order of orders) {
        const className = sanitizeFolderName(order.classroom?.name || 'Class');
        if (!ordersByClass[className]) ordersByClass[className] = [];
        ordersByClass[className].push(order);
      }
    } else {
      ordersByClass['Single_Order'] = orders;
    }

    // 5) Проходим по заказам и скачиваем фото
    for (const [className, classOrders] of Object.entries(ordersByClass)) {
      const rootFolder = schoolId ? zip.folder(className) : zip;
      if (!rootFolder) continue;

      for (let orderIndex = 0; orderIndex < classOrders.length; orderIndex++) {
        const order = classOrders[orderIndex];

        const safeSurname = sanitizeFolderName(order.parentSurname || 'Parent');
        const safeOrderName = `Заказ_${String(orderIndex + 1).padStart(3, '0')}_${safeSurname}`;

        const orderFolder = rootFolder.folder(safeOrderName);
        if (!orderFolder) continue;

        const items = order.items || [];

        const downloadTasks = items.map(async (item: any, itemIndex: number) => {
          const formatFolder = orderFolder.folder(sanitizeFolderName(item.format || 'UNSPECIFIED'));
          if (!formatFolder) return;

          try {
            const originalUrl: string | undefined = item.photo?.originalUrl;
            if (!originalUrl) throw new Error('Отсутствует originalUrl у фото');

            const storagePath = extractStoragePath(originalUrl);

            const { data, error } = await supabaseAdmin.storage
              .from('school-photos')
              .download(storagePath);

            if (error || !data) {
              throw new Error(error?.message || 'Не удалось скачать файл');
            }

            const arrayBuffer = await data.arrayBuffer();
            const extension = getExtFromUrl(originalUrl);

            // Дублируем в зависимости от количества
            const copies = Math.max(1, item.quantity || 1);
            for (let copyIndex = 1; copyIndex <= copies; copyIndex++) {
              const fileName = `photo-${String(itemIndex + 1).padStart(3, '0')}_copy${copyIndex}.${extension}`;
              formatFolder.file(fileName, arrayBuffer);
            }
          } catch (err: any) {
            console.error(`🔥 Ошибка скачивания фото OrderItem ${item.id}:`, err);
            formatFolder.file(
              `ERROR_item_${String(itemIndex + 1).padStart(3, '0')}.txt`,
              [
                `OrderItem: ${item.id}`,
                `PhotoId: ${item.photoId}`,
                `Путь: ${item.photo?.originalUrl}`,
                `Ошибка: ${err?.message || String(err)}`,
              ].join('\n')
            );
          }
        });

        await Promise.all(downloadTasks);
      }
    }

    // ✅ КЛЮЧЕВОЙ ФИКС: nodebuffer вместо blob (быстрее/стабильнее в Node)
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = schoolId
      ? `school-orders-${schoolId.slice(0, 8)}.zip`
      : `order-${orderId!.slice(0, 8)}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GLOBAL ZIP ERROR:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
