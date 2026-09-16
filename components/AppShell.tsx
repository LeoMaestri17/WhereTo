'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/plan', label: 'Plan' },
  { href: '/ideas', label: 'Trips' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/**
 * Mobile-first: this gets used one-handed on a phone.
 *
 * The nav is two items because the app does two things — answer the questions, or browse what
 * there is. Anything else on it would be a second product.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="type-title tracking-tight">SideQuest</span>
            <span className="type-micro hidden text-faint sm:inline">Out of LA</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-[0.875rem] transition-colors ${
                  isActive(pathname, item.href)
                    ? 'bg-surface-2 font-medium text-ink'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
