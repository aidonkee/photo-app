import React from 'react';
import Link from 'next/link';
import { getSchoolAndClasses } from '@/actions/parent/cart-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { Users, Image, ArrowRight } from 'lucide-react';

type PageProps = {
  params: Promise<{
    schoolSlug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { schoolSlug } = await params;
  const school = await getSchoolAndClasses(schoolSlug);

  if (!school) {
    return {
      title: 'Школа не найдена',
    };
  }

  return {
    title: `${school.name} - Фотогалерея`,
    description: `Просматривайте и заказывайте фотографии из ${school.name}`,
  };
}

export default async function SchoolLandingPage({ params }: PageProps) {
  const { schoolSlug } = await params;
  const school = await getSchoolAndClasses(schoolSlug);

  if (!school) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header
        className="py-12 px-4"
        style={{
          background: `linear-gradient(135deg, ${school.primaryColor}15 0%, ${school.primaryColor}30 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            {school.name}
          </h1>
          <p className="text-xl text-slate-700">
            Выберите ваш класс, чтобы просмотреть фотографии
          </p>
        </div>
      </header>

      {/* Classrooms Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {school.classrooms.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Классы отсутствуют
              </h3>
              <p className="text-slate-600">
                Фотографии скоро будут доступны. Пожалуйста, зайдите позже.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              Выберите ваш класс
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {school.classrooms.map((classroom) => (
                <Link
                  key={classroom.id}
                  href={`/s/${school.slug}/${classroom.id}`}
                >
                  <Card className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400 cursor-pointer group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="p-4 rounded-full"
                          style={{
                            backgroundColor: `${school.primaryColor}20`,
                          }}
                        >
                          <Users
                            className="w-8 h-8"
                            style={{ color: school.primaryColor }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
                            {classroom.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Image className="w-5 h-5" />
                          <span className="font-medium">
                            {classroom._count.photos} фото
                            {classroom._count.photos !== 1 ? 'графий' : 'графия'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-900 font-medium group-hover:gap-3 transition-all">
                          Просмотреть галерею
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}