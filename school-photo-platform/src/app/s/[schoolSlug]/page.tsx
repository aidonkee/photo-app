import React from 'react';
import { getSchoolAndClasses } from '@/actions/parent/cart-actions';
import { notFound } from 'next/navigation';
import SchoolClassroomsClient from '@/components/parent/SchoolClassroomsClient';

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
          background: `linear-gradient(to bottom, ${school.primaryColor}10, transparent)`,
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div
            className="inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-4"
            style={{
              backgroundColor: `${school.primaryColor}20`,
              color: school.primaryColor,
            }}
          >
            Фотогалерея
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {school.name}
          </h1>
          <div
            className="h-1.5 w-24 mx-auto rounded-full"
            style={{ backgroundColor: school.primaryColor }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        <SchoolClassroomsClient school={school} />
      </main>
    </div>
  );
}