'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useTranslation } from '@/stores/language-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { usePathname, useParams } from 'next/navigation';
import CartDrawer from './CartDrawer';
import { getPrice, PhotoFormat, SchoolPricing, formatPrice } from '@/config/pricing';

export default function GlobalCartOverlay() {
    const { t } = useTranslation();
    const pathname = usePathname();
    const params = useParams();
    const items = useCartStore((state) => state.items);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // We only show this on parent routes: /s/[schoolSlug]/[classId]
    const isParentRoute = pathname?.startsWith('/s/');
    const schoolSlug = params?.schoolSlug as string;
    const classId = params?.classId as string;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isParentRoute) return null;

    // Find the relevant school pricing if possible, otherwise use defaults
    // Note: In a real app we might fetch this or get it from a provider
    const schoolPricing: SchoolPricing = {
        priceA4: 2500, // Fallback defaults
        priceA5: 1500,
    };

    const classItems = items.filter(item => item.classId === classId);
    const totalPrice = classItems.reduce((acc, item) => acc + item.pricePerUnit * item.quantity, 0);
    const totalItems = classItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Button
                    onClick={() => setIsOpen(true)}
                    size="lg"
                    className="h-16 px-6 bg-slate-900 hover:bg-slate-800 shadow-2xl gap-3 text-lg rounded-full"
                >
                    <ShoppingCart className="w-6 h-6" />
                    <span className="font-bold">{formatPrice(totalPrice)}</span>
                    {totalItems > 0 && (
                        <Badge className="bg-white text-slate-900 hover:bg-white ml-1 text-sm font-bold">
                            {totalItems}
                        </Badge>
                    )}
                </Button>
            </div>

            {schoolSlug && classId && (
                <CartDrawer
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    classId={classId}
                    schoolSlug={schoolSlug}
                    schoolPricing={schoolPricing}
                />
            )}
        </>
    );
}
