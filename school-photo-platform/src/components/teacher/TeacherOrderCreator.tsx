'use client';

import React, { useState, useTransition, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Plus, Minus, Trash2, CheckCircle, Package } from 'lucide-react';
import { createTeacherOrderAction } from '@/actions/teacher/create-order-action';
import { PhotoFormat, FORMAT_LABELS, getPrice, formatPrice } from '@/config/pricing';
import { toast } from 'sonner';
import { X } from 'lucide-react';

type Photo = {
  id: string;
  watermarkedUrl: string;
  thumbnailUrl: string | null;
  alt: string | null;
  fileName: string | null;
};

type TeacherOrderCreatorProps = {
  photos: Photo[];
  schoolPricing: {
    priceA4: number;
    priceA5: number;
  };
  onSuccess?: () => void;
  isContinuous?: boolean;
};

type SelectedItem = {
  cartItemId: string; // just a unique local id
  photoId: string;
  photoUrl: string;
  photoIdentifier: string;
  format: PhotoFormat;
  quantity: number;
  pricePerUnit: number;
};

export default function TeacherOrderCreator({
  photos,
  schoolPricing,
  onSuccess,
  isContinuous = false,
}: TeacherOrderCreatorProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [parentName, setParentName] = useState('');
  const [parentSurname, setParentSurname] = useState('');
  const surnameInputRef = useRef<HTMLInputElement>(null);
  const [parentPhone, setParentPhone] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Search logic: by index or filename
  const searchResults = useMemo(() => {
    
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      return photos.map((photo, index) => {
        const displayIndex = index + 1;
        const paddedIndexStr = String(displayIndex).padStart(2, '0');
        return { 
          ...photo, 
          index: displayIndex, 
          identifier: photo.fileName ? photo.fileName.replace(/\.[^/.]+$/, "") : (photo.alt ? photo.alt.replace(/\.[^/.]+$/, "") : `#${paddedIndexStr}`) 
        };
      });
    }
    
    return photos.map((photo, index) => {
      const displayIndex = index + 1;
      const indexStr = String(displayIndex);
      const paddedIndexStr = String(displayIndex).padStart(2, '0');
      
      const fileNamePart = photo.fileName ? photo.fileName.replace(/\.[^/.]+$/, "").toLowerCase() : '';
      const altPart = photo.alt ? photo.alt.replace(/\.[^/.]+$/, "").toLowerCase() : '';
      const idPart = photo.id.slice(-4).toLowerCase();

      const identifier = photo.fileName 
        ? photo.fileName.replace(/\.[^/.]+$/, "") 
        : (photo.alt ? photo.alt.replace(/\.[^/.]+$/, "") : `#${paddedIndexStr}`);
      
      const isIndexMatch = indexStr === query || paddedIndexStr === query;
      const isNameMatch = fileNamePart.includes(query) || altPart.includes(query) || identifier.toLowerCase().includes(query);
      const isIdMatch = idPart === query;
      
      if (isIndexMatch || isNameMatch || isIdMatch) {
         return { 
           ...photo, 
           index: displayIndex, 
           identifier 
         };
      }
      return null;
    }).filter(Boolean);
  }, [photos, searchQuery]);

  const addPhoto = (photo: any, format: PhotoFormat) => {
    const existingIndex = selectedItems.findIndex(i => i.photoId === photo.id && i.format === format);
    const price = getPrice(format, schoolPricing as any);

    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        cartItemId: Math.random().toString(),
        photoId: photo.id,
        photoUrl: photo.watermarkedUrl,
        photoIdentifier: photo.identifier,
        format,
        quantity: 1,
        pricePerUnit: price
      }]);
    }
    toast.success('Фото добавлено');
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (cartItemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const totalSum = selectedItems.reduce((acc, item) => acc + (item.pricePerUnit * item.quantity), 0);

  const handleSubmit = async () => {
    if (!parentName.trim() || !parentSurname.trim()) {
      toast.error('Введите имя и фамилию родителя');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Добавьте хотя бы одно фото');
      return;
    }

    setIsPending(true);
    
    try {
      const result = await createTeacherOrderAction({
        parentName,
        parentSurname,
        parentPhone,
        items: selectedItems,
        totalSum
      });

      if (result.success) {
        toast.success('Заказ успешно создан');
        
        if (isContinuous) {
          // Reset form for next student
          setParentName('');
          setParentSurname('');
          setParentPhone('');
          setSelectedItems([]);
          setSearchQuery('');
          setIsPending(false);
          setIsRedirecting(false);
          if (onSuccess) onSuccess();
          
          // Re-focus the first field for the next student
          setTimeout(() => {
            surnameInputRef.current?.focus();
          }, 100);
        } else {
          setIsRedirecting(true);
          router.push('/teacher-dashboard');
        }
      } else {
        setIsPending(false);
      }
    } catch (err: any) {
      setIsPending(false);
      toast.error(err.message || 'Ошибка создания заказа');
    }
  };

  useEffect(() => {
    if (isContinuous && parentName === '' && parentSurname === '' && selectedItems.length === 0 && !isPending) {
       formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [parentName, parentSurname, selectedItems.length, isContinuous, isPending]);

  return (
    <div className="relative pb-24 lg:pb-0" ref={formRef}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Form & Search */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Данные родителя</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Фамилия *</Label>
                <Input
                  ref={surnameInputRef}
                  value={parentSurname}
                  onChange={(e) => setParentSurname(e.target.value)}
                  placeholder="Иванов"
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Имя *</Label>
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Иван"
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Телефон (необязательно)</Label>
                <Input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+7 777 777 77 77"
                  className="h-10 sm:h-11"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Добавление фотографий</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Номер фото (1, 02) или название"
                className="pl-10 pr-10 h-11 sm:h-12 text-base"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Всего в базе: {photos.length}</span>
              {searchQuery && (
                <span className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Найдено: {searchResults.length}</span>
              )}
            </div>

            <div className="mt-2">
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
                  {searchResults.map((photo: any) => (
                    <div key={photo.id} className="border border-slate-200 rounded-xl overflow-hidden group flex flex-col bg-slate-50/30">
                      <div className="relative aspect-[3/4] bg-slate-100 flex-shrink-0">
                        <img 
                          src={photo.thumbnailUrl || photo.watermarkedUrl} 
                          alt="Photo"
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold shadow-lg">
                          {photo.identifier}
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-white flex flex-col gap-1.5 flex-grow">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 sm:h-9 text-[10px] sm:text-xs px-1 border-slate-200 hover:bg-slate-50 font-bold"
                          onClick={() => addPhoto(photo, PhotoFormat.A5)}
                        >
                          + A5 ({formatPrice(schoolPricing.priceA5)})
                        </Button>
                        <Button
                          size="sm"
                          className="w-full h-8 sm:h-9 text-[10px] sm:text-xs px-1 bg-slate-900 hover:bg-slate-800 font-bold"
                          onClick={() => addPhoto(photo, PhotoFormat.A4)}
                        >
                          + A4 ({formatPrice(schoolPricing.priceA4)})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Search className="w-6 h-6 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Ничего не найдено</p>
                  <button onClick={() => setSearchQuery('')} className="text-blue-600 text-xs mt-1 font-bold">Сбросить</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout/Cart Summary (Desktop) or Hidden (Mobile Sticky Bar will handle it) */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              Заказ ({selectedItems.length})
            </h2>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedItems.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  Выберите фото слева
                </div>
              ) : (
                selectedItems.map((item) => (
                  <CartItemRow 
                    key={item.cartItemId} 
                    item={item} 
                    onUpdateQuantity={updateQuantity} 
                    onRemove={removeItem} 
                  />
                ))
              )}
            </div>

            <div className="border-t border-slate-200 mt-6 pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                <span>Итого:</span>
                <span>{formatPrice(totalSum)}</span>
              </div>

              <SubmitButton 
                isPending={isPending} 
                isRedirecting={isRedirecting} 
                disabled={selectedItems.length === 0} 
                onClick={handleSubmit} 
              />
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Выбрано: {selectedItems.length}</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight">{formatPrice(totalSum)}</span>
          </div>
          <div className="flex-1 max-w-[200px]">
            <SubmitButton 
              isPending={isPending} 
              isRedirecting={isRedirecting} 
              disabled={selectedItems.length === 0} 
              onClick={handleSubmit} 
              className="h-12 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: { 
  item: SelectedItem, 
  onUpdateQuantity: (id: string, d: number) => void,
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="w-12 h-16 shrink-0 bg-white rounded overflow-hidden border border-slate-200">
        <img src={item.photoUrl} alt="Item" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <span className="font-bold text-sm text-slate-900 block truncate">#{item.photoIdentifier}</span>
          <button onClick={() => onRemove(item.cartItemId)} className="text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-slate-500 font-medium">
          {FORMAT_LABELS[item.format]} • {formatPrice(item.pricePerUnit)}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.cartItemId, -1)}
              disabled={item.quantity <= 1}
              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-1 w-6 text-center text-xs font-bold">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.cartItemId, 1)}
              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="font-bold text-slate-900 text-xs">{formatPrice(item.pricePerUnit * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ isPending, isRedirecting, disabled, onClick, className }: {
  isPending: boolean,
  isRedirecting: boolean,
  disabled: boolean,
  onClick: () => void,
  className?: string
}) {
  return (
    <Button
      className={`font-bold bg-green-600 hover:bg-green-700 shadow-sm border-b-4 border-green-800 active:border-b-active active:translate-y-0.5 transition-all ${className}`}
      onClick={onClick}
      disabled={isPending || isRedirecting || disabled}
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
          ...
        </span>
      ) : isRedirecting ? (
        <span className="flex items-center gap-2">
          В список...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Готово
        </span>
      )}
    </Button>
  );
}
