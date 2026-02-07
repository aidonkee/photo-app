'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { useTranslation } from '@/stores/language-store';
import { getClassroomPhotos } from '@/actions/parent/cart-actions';
import PhotoGallery from '@/components/parent/PhotoGallery';
import CartDrawer from '@/components/parent/CartDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';


type PageProps = {
  params: Promise<{
    schoolSlug: string;
    classId: string;
  }>;
};
type Photo = {
  id: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl: string | null;
  alt: string | null;
  width: number;
  height: number;
  uploadedAt: string | Date;
};

type ClassroomData = {
  id: string;
  name: string;
  school: {
    name: string;
    priceA4: number;
    priceA5: number;
  };
  photos: Photo[];
};
// Компонент ошибки для галереи
function GalleryErrorFallback() {
  return (
    <div className="text-center py-20 border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50">
      <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        Ошибка загрузки галереи
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Не удалось отобразить фотографии. Попробуйте обновить страницу.
      </p>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Обновить страницу
      </Button>
    </div>
  );
}

// Компонент ошибки для корзины
function CartErrorFallback() {
  return null; // Просто скрываем кнопку корзины при ошибке
}

export default function ClassroomGalleryPage({ params }: PageProps) {
  const { t, lang } = useTranslation();
  const { schoolSlug, classId } = use(params);
  const [classroom, setClassroom] = useState<ClassroomData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems(classId));

  React.useEffect(() => {
    async function loadData() {
      try {
        const data = await getClassroomPhotos(classId);
        if (!data) {
          notFound();
        }
        setClassroom(data);
      } catch (err) {
        console.error('Failed to load classroom:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('loading_photos')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Ошибка</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!classroom) {
    notFound();
  }

  const schoolPricing = {
    priceA4: classroom.school.priceA4,
    priceA5: classroom.school.priceA5,
  };

  const getPhotosWord = (count: number) => {
    if (lang === 'kk') {
      return t('photos_count');
    }
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'фотографий';
    }
    if (lastDigit === 1) {
      return 'фотография';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'фотографии';
    }
    return 'фотографий';
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-slate-600 mb-4">
              Произошла непредвиденная ошибка
            </p>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Обновить страницу
            </Button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="py-8 px-4 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <Link href={`/s/${schoolSlug}`}>
                <Button variant="ghost" className="gap-2 -ml-2 text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" />
                  {t('back_to')} {classroom.school.name}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="gap-2">
                  Зайти как учитель
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {classroom.name}
                </h1>
                <p className="text-lg text-slate-600 mt-2">
                  {classroom.photos.length} {getPhotosWord(classroom.photos.length)} {t('photos_available')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Gallery - обёрнута в отдельный ErrorBoundary */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          <ErrorBoundary fallback={<GalleryErrorFallback />}>
            <PhotoGallery
              photos={classroom.photos}
              schoolPricing={schoolPricing}
              classId={classId}
            />
          </ErrorBoundary>
        </main>

        {/* Floating Cart Button - обёрнут в ErrorBoundary */}
        <ErrorBoundary fallback={<CartErrorFallback />}>
          {getTotalItems > 0 && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                onClick={() => setCartOpen(true)}
                size="lg"
                className="h-16 px-6 bg-slate-900 hover:bg-slate-800 shadow-2xl gap-3 text-lg"
              >
                <ShoppingCart className="w-6 h-6" />
                {t('cart_title')}
                <Badge className="bg-white text-slate-900 hover:bg-white ml-2">
                  {getTotalItems}
                </Badge>
              </Button>
            </div>
          )}
        </ErrorBoundary>

        {/* Cart Drawer - обёрнут в ErrorBoundary */}
        <ErrorBoundary fallback={null}>
          <CartDrawer
            open={cartOpen}
            onOpenChange={setCartOpen}
            classId={classId}
            schoolSlug={schoolSlug}
            schoolPricing={schoolPricing}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}