'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { getClassroomPhotos } from '@/actions/parent/cart-actions';
import PhotoGallery from '@/components/parent/PhotoGallery';
import CartDrawer from '@/components/parent/CartDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    schoolSlug:  string;
    classId: string;
  }>;
};

export default function ClassroomGalleryPage({ params }: PageProps) {
  const { schoolSlug, classId } = use(params);
  const [classroom, setClassroom] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems());

  React.useEffect(() => {
    async function loadData() {
      const data = await getClassroomPhotos(classId);
      if (!data) {
        notFound();
      }
      setClassroom(data);
      setLoading(false);
    }
    loadData();
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Загрузка фотографий...</p>
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
    priceMagnet: classroom.school.priceMagnet,
    priceDigital: classroom.school.priceDigital,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="py-8 px-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <Link href={`/s/${schoolSlug}`}>
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Назад к {classroom.school.name}
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {classroom.name}
              </h1>
              <p className="text-lg text-slate-600 mt-2">
                {classroom.photos.length} фотографи{classroom.photos.length !== 1 ? 'й' : 'я'} доступно
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* ✅ Передаём photoColumns и photoIndexMap для правильной нумерации */}
        <PhotoGallery 
          photos={classroom.photos} 
          photoColumns={classroom. photoColumns}
          photoIndexMap={classroom. photoIndexMap}
          schoolPricing={schoolPricing} 
        />
      </main>

      {/* Floating Cart Button */}
      {getTotalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setCartOpen(true)}
            size="lg"
            className="h-16 px-6 bg-slate-900 hover:bg-slate-800 shadow-2xl gap-3 text-lg"
          >
            <ShoppingCart className="w-6 h-6" />
            Корзина
            <Badge className="bg-white text-slate-900 hover:bg-white ml-2">
              {getTotalItems}
            </Badge>
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        classId={classId}
        schoolSlug={schoolSlug}
        schoolPricing={schoolPricing}
      />
    </div>
  );
}