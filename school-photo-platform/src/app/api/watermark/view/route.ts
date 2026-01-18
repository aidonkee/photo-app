import { NextRequest, NextResponse } from 'next/server';
import { addWatermark } from '@/lib/watermark';
import { getPublicUrl } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get('url');
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Нормализуем: если пришёл путь — сделаем публичный URL; если уже полный — вернём как есть
    const normalizedUrl = getPublicUrl(decodeURIComponent(imageUrl));

    const imageResponse = await fetch(normalizedUrl, { headers: { Accept: 'image/*' } });
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, normalizedUrl);
      return NextResponse.json({ error: 'Failed to fetch original image' }, { status: 500 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await addWatermark(buffer);

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Watermark proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}