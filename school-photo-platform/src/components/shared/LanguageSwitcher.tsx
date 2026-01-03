'use client';

import React from 'react';
import { useLanguageStore } from '@/stores/language-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
  isEnabled: boolean;
  className?: string;
};

export default function LanguageSwitcher({
  isEnabled,
  className,
}: LanguageSwitcherProps) {
  const lang = useLanguageStore((state) => state.lang);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  // Don't render if Kazakh is not enabled for this school
  if (!isEnabled) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={lang === 'ru' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('ru')}
        className={cn(
          'w-16 font-semibold',
          lang === 'ru' && 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        RU
      </Button>
      <Button
        variant={lang === 'kk' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('kk')}
        className={cn(
          'w-16 font-semibold',
          lang === 'kk' && 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        KZ
      </Button>
    </div>
  );
}