'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type WatermarkedImageProps = {
  src?:  string | null;
  alt?: string | null;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
};

export default function WatermarkedImage({
  src,
  alt,
  className,
  fallbackClassName,
  width,
  height,
  onClick,
}: WatermarkedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Show placeholder if no src or error occurred
  if (!src || error) {
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
    <div className={cn('relative overflow-hidden', className)} onClick={onClick}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt || 'Photo'}
        width={width}
        height={height}
        className={cn('w-full h-full object-cover', loading && 'opacity-0')}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        loading="lazy"
      />
    </div>
  );
}