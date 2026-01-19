'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import SchoolForm from '@/components/admin/SchoolForm';
import ClassroomForm from '@/components/admin/ClassroomForm';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileEdit,
  LogOut,
  Plus,
  Lock,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';

type School = {
  id: string;
  name: string;
  slug: string;
  classrooms: Array<{
    id: string;
    name: string;
    isLocked: boolean;
  }>;
};

type SidebarProps = {
  role:   'SUPER_ADMIN' | 'ADMIN';
  schools: School[];
  onLogout: () => void;
};

export default function Sidebar({ role, schools, onLogout }:  SidebarProps) {
  const pathname = usePathname();
  const [createSchoolOpen, setCreateSchoolOpen] = useState(false);
  const [createClassroomOpen, setCreateClassroomOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // ✅ FIX: Используем useState для defaultValue чтобы избежать hydration mismatch
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  const getCurrentSchoolId = (): string | undefined => {
    const match = pathname?. match(/\/admin\/schools\/([^\/]+)/);
    return match ? match[1] : undefined;
  };

  // ✅ FIX:  Устанавливаем значение только на клиенте
  useEffect(() => {
    const currentSchoolId = getCurrentSchoolId();
    if (currentSchoolId) {
      setAccordionValue(currentSchoolId);
    }
  }, [pathname]);

  const isClassroomActive = (classId: string) => {
    return pathname?.includes(`/classrooms/${classId}`);
  };

  const isSchoolPageActive = (schoolId: string) => {
    return pathname === `/admin/schools/${schoolId}`;
  };

  const isOrdersPageActive = (schoolId: string) => {
    return pathname?. includes(`/admin/schools/${schoolId}/orders`);
  };

  const isSchoolActive = (school: School) => {
    return (
      school.classrooms.some((classroom) => isClassroomActive(classroom.id)) ||
      isSchoolPageActive(school.id) ||
      isOrdersPageActive(school.id)
    );
  };

  const handleAddClass = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setCreateClassroomOpen(true);
  };

  const superAdminLinks = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Photographers',
      href: '/admins',
      icon: Users,
    },
  ];

  const adminLinks = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Edit Requests',
      href: '/admin/requests',
      icon: FileEdit,
    },
  ];

  const topLinks = role === 'SUPER_ADMIN' ? superAdminLinks : adminLinks;

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">
          {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Photographer'}
        </h2>
      </div>

      {/* Create School Button */}
      {role === 'ADMIN' && (
        <div className="p-3 border-b border-slate-700">
          <Button
            onClick={() => setCreateSchoolOpen(true)}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 gap-2 h-9 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Создать школу
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {/* Top Links */}
        <ul className="p-3 space-y-1 border-b border-slate-700">
          {topLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all',
                    isActive
                      ? 'bg-white text-slate-900 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Schools Accordion */}
        {role === 'ADMIN' && schools.length > 0 && (
          <div className="p-3">
            <div className="flex items-center gap-2 px-2 mb-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Мои школы
              </span>
            </div>

            {/* ✅ FIX:  Используем state вместо defaultValue */}
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={setAccordionValue}
              className="space-y-1"
            >
              {schools.map((school) => {
                const schoolActive = isSchoolActive(school);

                return (
                  <AccordionItem
                    key={school.id}
                    value={school.id}
                    className={cn(
                      'border-0 rounded-md overflow-hidden',
                      schoolActive && 'bg-slate-800/50'
                    )}
                  >
                    <AccordionTrigger
                      className={cn(
                        'px-3 py-2 hover:no-underline hover:bg-slate-800 rounded-md transition-colors text-sm',
                        schoolActive && 'text-white font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <Building2
                          className={cn(
                            'w-4 h-4 flex-shrink-0',
                            schoolActive ?  'text-white' : 'text-slate-400'
                          )}
                        />
                        <span className="truncate text-slate-200">{school.name}</span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-1 pt-1">
                      <ul className="space-y-0.5 ml-6">
                        {/* School Overview Link */}
                        <li>
                          <Link
                            href={`/admin/schools/${school.id}`}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                              isSchoolPageActive(school.id)
                                ? 'bg-white text-slate-900 font-medium'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                          >
                            <ChevronRight className="w-3 h-3" />
                            Обзор школы
                          </Link>
                        </li>

                        {/* Orders Link */}
                        <li>
                          <Link
                            href={`/admin/schools/${school.id}/orders`}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                              isOrdersPageActive(school.id)
                                ?  'bg-white text-slate-900 font-medium'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                          >
                            <ShoppingCart className="w-3 h-3 flex-shrink-0" />
                            Заказы
                          </Link>
                        </li>

                        {/* Classrooms */}
                        {school.classrooms.map((classroom) => (
                          <li key={classroom.id}>
                            <Link
                              href={`/admin/schools/${school.id}/classrooms/${classroom.id}`}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                                isClassroomActive(classroom.id)
                                  ?  'bg-white text-slate-900 font-medium'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              )}
                            >
                              <Users className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate flex-1">{classroom.name}</span>
                              {classroom.isLocked && (
                                <Lock className="w-3 h-3 text-red-400 flex-shrink-0" />
                              )}
                            </Link>
                          </li>
                        ))}

                        {/* Add Classroom Button */}
                        <li>
                          <button
                            onClick={() => handleAddClass(school.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Добавить класс
                          </button>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        {/* Empty State */}
        {role === 'ADMIN' && schools.length === 0 && (
          <div className="p-4 text-center text-slate-400 text-sm">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-slate-300">Школы не созданы</p>
            <Button
              onClick={() => setCreateSchoolOpen(true)}
              variant="link"
              className="mt-2 text-white hover:text-slate-200"
            >
              Создать первую школу
            </Button>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-slate-700">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white h-9 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </Button>
      </div>

      {/* Modals */}
      <SchoolForm open={createSchoolOpen} onOpenChange={setCreateSchoolOpen} />
      {selectedSchoolId && (
        <ClassroomForm
          schoolId={selectedSchoolId}
          open={createClassroomOpen}
          onOpenChange={setCreateClassroomOpen}
        />
      )}
    </aside>
  );
}