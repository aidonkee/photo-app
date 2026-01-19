'use client';

import React from 'react';

type PublicSchoolLayoutProps = {
  children: React.ReactNode;
  school: {
    name: string;
    primaryColor: string;
  };
};

export default function PublicSchoolLayout({
  children,
  school,
}: PublicSchoolLayoutProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${school.primaryColor}10, ${school.primaryColor}05)`,
      }}
    >
      <style jsx global>{`
        :root {
          --school-primary: ${school.primaryColor};
        }
      `}</style>
      {children}
    </div>
  );
}