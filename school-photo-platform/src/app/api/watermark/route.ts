import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1500;
    const height = metadata.height || 1000;

    // Create watermark SVG
    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="${Math.min(width, height) * 0.1}"
          font-weight="bold"
          fill="white"
          fill-opacity="0.3"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(-30 ${width / 2} ${height / 2})"
          filter="url(#shadow)"
        >
          PREVIEW
        </text>
      </svg>
    `;

    // Apply watermark
    const watermarkedBuffer = await sharp(buffer)
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          blend: 'over',
        },
      ])
      .jpeg({ quality: 85 })
      .toBuffer();

    // ✅ ИСПРАВЛЕНИЕ: Оборачиваем Buffer в Blob
    return new NextResponse(new Blob([watermarkedBuffer as any]), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="watermarked_${file.name}"`,
      },
    });
  } catch (error: any) {
    console.error('Watermark API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}