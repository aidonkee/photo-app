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
          lang === 'ru' && 'bg-slate-900 hover:bg-slate-800'
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
          lang === 'kk' && 'bg-slate-900 hover:bg-slate-800'
        )}
      >
        KZ
      </Button>
    </div>
  );
}