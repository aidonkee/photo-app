'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deletePhotoAction } from '@/actions/admin/photo-actions';
import { toast } from 'sonner'; // Или используй alert, если нет sonner

export default function DeletePhotoButton({ photoId }: { photoId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это фото?')) return;

    setIsDeleting(true);
    try {
      await deletePhotoAction(photoId);
      // toast.success('Фото удалено'); // Если подключен sonner
    } catch (error) {
      alert('Не удалось удалить фото. Возможно, оно уже заказано.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      className="gap-2"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      Удалить
    </Button>
  );
}