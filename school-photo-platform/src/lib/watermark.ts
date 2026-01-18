import sharp from 'sharp';
import path from 'path';

const MAX_WIDTH = 1500;

export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    let width = metadata.width;
    let height = metadata.height;
    let processedBuffer = buffer;

    // Ресайз
    if (width > MAX_WIDTH) {
      const aspectRatio = height / width;
      width = MAX_WIDTH;
      height = Math.round(MAX_WIDTH * aspectRatio);
      processedBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    // Путь к твоему PNG-логотипу
    // Процесс ищет файл в корне проекта
    const watermarkPath = path.join(process.cwd(), 'watermark.png');

    const finalBuffer = await sharp(processedBuffer)
      .composite([
        {
          input: watermarkPath,
          tile: true,       // Размножает картинку сеткой по всему фото
          blend: 'over',    // Накладывает сверху
           // Прозрачность (можно настроить в самом PNG)
        },
      ])
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    return {
      buffer: finalBuffer,
      width,
      height,
      size: finalBuffer.length,
    };
  } catch (error: any) {
    console.error('Sharp Watermark Error:', error);
    // Если PNG не найден или упал sharp, возвращаем оригинал, чтобы не ломать загрузку
    return {
        buffer,
        width: 0,
        height: 0,
        size: buffer.length
    };
  }
}

export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  return await sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// Функцию createWatermarkSvg можно удалить совсем