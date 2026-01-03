'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import Sidebar from './Sidebar';

type School = {
  id: string;
  name: string;
  slug: string;
  classrooms: Array<{
    id:  string;
    name: string;
    isLocked: boolean;
  }>;
};

type MobileSidebarProps = {
  role: 'SUPER_ADMIN' | 'ADMIN';
  schools: School[];
  onLogout: () => void;
};

export default function MobileSidebar({ role, schools, onLogout }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-40 bg-white shadow-md"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar role={role} schools={schools} onLogout={handleLogout} />
      </SheetContent>
    </Sheet>
  );
}