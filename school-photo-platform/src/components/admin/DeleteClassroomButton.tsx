'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteClassroomAction } from '@/actions/admin/classroom-actions';
// import { toast } from 'sonner'; // Раскомментируй, если используешь sonner

export default function DeleteClassroomButton({ classId }: { classId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Вы уверены, что хотите удалить этот класс? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // ИСПРАВЛЕНИЕ: Мы просто вызываем функцию. 
      // Если будет ошибка, код сразу перепрыгнет в catch.
      await deleteClassroomAction(classId);
      
      // Если дошли сюда — значит всё успешно
      // alert('Класс удален'); 
    } catch (error: any) {
      // Ловим ошибку здесь
      alert(error.message || 'Не удалось удалить класс. Возможно, в нем есть фото или заказы.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="icon"
      className="h-8 w-8 absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Удалить класс"
    >
      {isDeleting ? (
        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}