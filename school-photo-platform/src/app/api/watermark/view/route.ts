import { NextRequest, NextResponse } from 'next/server';
import { addWatermark } from '@/lib/watermark';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Декодируем URL
    const decodedUrl = decodeURIComponent(imageUrl);

    // Fetch original image from Supabase
    const imageResponse = await fetch(decodedUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, decodedUrl);
      return NextResponse.json(
        { error: 'Failed to fetch original image' },
        { status:  500 }
      );
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer. from(arrayBuffer);

    // Добавляем watermark используя существующую функцию
    const result = await addWatermark(buffer);

    // Возвращаем изображение с watermark
    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Watermark proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}