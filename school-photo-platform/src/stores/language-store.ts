import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dictionary, Language, TranslationKey } from '@/lib/dictionary';

type LanguageStore = {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: 'ru', // Default language

      setLanguage: (lang:  Language) => {
        set({ lang });
      },

      t: (key: TranslationKey): string => {
        const { lang } = get();
        return dictionary[lang][key] || dictionary.ru[key] || key;
      },
    }),
    {
      name: 'school-photo-language',
    }
  )
);

// Helper hook for easier usage
export function useTranslation() {
  const lang = useLanguageStore((state) => state.lang);
  const t = useLanguageStore((state) => state.t);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return { lang, t, setLanguage };
}