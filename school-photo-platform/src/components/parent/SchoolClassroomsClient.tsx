'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Image, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/stores/language-store';

type Classroom = {
  id: string;
  name: string;
  _count: {
    photos: number;
  };
};

type School = {
  slug: string;
  name: string;
  primaryColor: string;
  classrooms: Classroom[];
};

type SchoolClassroomsClientProps = {
  school: School;
};

export default function SchoolClassroomsClient({ school }: SchoolClassroomsClientProps) {
  const { t, lang } = useTranslation();

  const getPhotosWord = (count: number) => {
    if (lang === 'kk') {
      return t('photos_word');
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

  if (school.classrooms.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t('no_classrooms')}
          </h3>
          <p className="text-slate-600">
            {t('photos_coming_soon')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
        {t('choose_your_class')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {school.classrooms.map((classroom) => (
          <Link
            key={classroom.id}
            href={`/s/${school.slug}/${classroom.id}`}
          >
            <Card className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-slate-400 cursor-pointer group h-full">
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
                      {classroom._count.photos} {getPhotosWord(classroom._count.photos)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900 font-medium group-hover:gap-3 transition-all">
                    {t('view_gallery')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}