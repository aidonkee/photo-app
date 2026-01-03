import React from 'react';
import { notFound } from 'next/navigation';
import { getSchoolAndClasses } from '@/actions/parent/cart-actions';
import PublicSchoolLayout from '@/components/layouts/PublicSchoolLayout';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    schoolSlug: string;
  }>;
};

export async function generateMetadata({ params }: LayoutProps) {
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

export default async function SchoolLayout({ children, params }: LayoutProps) {
  const { schoolSlug } = await params;
  const school = await getSchoolAndClasses(schoolSlug);

  if (!school) {
    notFound();
  }

  return (
    <PublicSchoolLayout
      school={{
        name: school.name,
        primaryColor: school.primaryColor,
      }}
    >
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher isEnabled={school.isKazakhEnabled || false} />
      </div>
      {children}
    </PublicSchoolLayout>
  );
}