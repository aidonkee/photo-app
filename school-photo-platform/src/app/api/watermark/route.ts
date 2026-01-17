import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const photoId = searchParams.get('id');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    // Fetch original image from Supabase
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1500;
    const height = metadata. height || 1000;

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

    return new NextResponse(watermarkedBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Watermark proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status:  500 }
    );
  }
}