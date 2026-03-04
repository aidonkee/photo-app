'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({
    href,
    children,
    icon
}: {
    href: string;
    children: React.ReactNode;
    icon: React.ReactNode;
}) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors shrink-0 ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                }`}
        >
            {icon}
            {children}
        </Link>
    );
}
