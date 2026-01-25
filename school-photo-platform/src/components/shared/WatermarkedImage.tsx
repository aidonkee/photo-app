'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type WatermarkedImageProps = {
  src?:  string | null;
  alt?:  string | null;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  onClick?: () => void;
};

export default function WatermarkedImage({
  src,
  alt,
  className,
  fallbackClassName,
  sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
  onClick,
}: WatermarkedImageProps) {
  const [error, setError] = useState(false);

  if (! src || error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-100 border-2 border-slate-200',
          fallbackClassName || className
        )}
        onClick={onClick}
      >
        <ImageIcon className="w-12 h-12 text-slate-400" />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} onClick={onClick}>
      <Image
        src={src}
        alt={alt || 'Фото'}
        fill
        sizes={sizes}
        className="object-contain"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
}