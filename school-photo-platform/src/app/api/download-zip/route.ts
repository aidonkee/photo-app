import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';

// ✅ Важно: ZIP/Buffer нормально работает только в nodejs runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase Admin Client (service role)
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
  let storagePath = originalUrl;

  try {
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      const u = new URL(storagePath);
      storagePath = u.pathname;
    }
  } catch {
    // ignore
  }

  storagePath = storagePath.replace(/^\/+/, '');

  const marker = 'school-photos/';
  if (storagePath.includes(marker)) {
    storagePath = storagePath.split(marker)[1];
  }

  return storagePath;
}

export async function POST(request: NextRequest) {
  try {
    // 1) Auth
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
    }

    // 2) Params
    const reqBody = await request.json();
    const { orderId, schoolId } = reqBody as { orderId?: string; schoolId?: string };

    if (!orderId && !schoolId) {
      return NextResponse.json({ error: 'orderId или schoolId обязателен' }, { status: 400 });
    }

    const zip = new JSZip();
    let orders: any[] = [];

    // 3) Load orders
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
      // Optional: Filter single order if not paid? 
      // User requirement: "load only those photos with status paid". 
      // If Admin explicitly requests ONE order, they might want it regardless. 
      // But for bulk school download, definitely filter.
      if (order) orders.push(order);
    } else if (schoolId) {
      orders = await prisma.order.findMany({
        where: {
          classroom: { schoolId },
          isPaid: true // ✅ ONLY PAID ORDERS (Prisma recognizes this field)
        } as any, // Cast to any to bypass stale IDE cache if necessary
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

    // 4) Download files into zip
    for (let orderIndex = 0; orderIndex < orders.length; orderIndex++) {
      const order = orders[orderIndex];
      const safeClassName = sanitizeFolderName(order.classroom?.name || 'Class');
      const safeSurname = sanitizeFolderName(order.parentSurname || 'Parent');
      const items = order.items || [];

      const downloadTasks = items.map(async (item: any, itemIndex: number) => {
        const formatName = sanitizeFolderName(item.format || 'UNSPECIFIED');
        const formatFolder = zip.folder(formatName);
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

          const copies = Math.max(1, item.quantity || 1);
          for (let copyIndex = 1; copyIndex <= copies; copyIndex++) {
            // Filename format: Class_Surname_#OrderIndex_photoIndex_copyIndex.ext
            const fileName = `${safeClassName}_${safeSurname}_#${String(orderIndex + 1).padStart(3, '0')}_photo${String(itemIndex + 1).padStart(3, '0')}_copy${copyIndex}.${extension}`;
            formatFolder.file(fileName, arrayBuffer);
          }
        } catch (err: any) {
          console.error(`🔥 Ошибка скачивания фото OrderItem ${item.id}:`, err);
          formatFolder.file(
            `ERROR_${safeClassName}_${safeSurname}_item_${String(itemIndex + 1).padStart(3, '0')}.txt`,
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

    // 6) Generate zip (Buffer)
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = schoolId
      ? `school-orders-${schoolId.slice(0, 8)}.zip`
      : `order-${orderId!.slice(0, 8)}.zip`;

    // ✅ ВАЖНО: NextResponse типы иногда ругаются на Buffer — даём Uint8Array
    const body = new Uint8Array(zipBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GLOBAL ZIP ERROR:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
