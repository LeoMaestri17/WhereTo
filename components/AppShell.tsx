'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useStore } from '@/lib/store/StoreProvider';
import { currentUser } from '@/lib/store/selectors';
import { Onboarding } from './Onboarding';
import { Avatar } from './people';

const NAV = [
  { href: '/', label: 'Happening' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/events', label: 'Events' },
  { href: '/post', label: 'Post' },
  { href: '/profile', label: 'You' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/**
 * Mobile-first: the nav sits at the bottom on a phone, where a thumb reaches it, and moves to
 * the top on a wider screen. Nothing else about the layout changes.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const pathname = usePathname();
  const me = currentUser(state);

  if (!me || !state.onboarded) {
    return <Onboarding />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="type-title tracking-tight">SideQuest</span>
            <span className="type-micro hidden text-faint sm:inline">USC</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            {NAV.slice(0, 4).map((item) => (
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

          <Link
            href="/profile"
            className="ml-auto flex items-center gap-2 sm:ml-1"
            aria-label="Your profile"
          >
            <Avatar user={me} size="sm" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-16">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-6xl">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.6875rem] font-medium transition-colors ${
                isActive(pathname, item.href) ? 'text-accent' : 'text-muted'
              }`}
            >
              <NavIcon href={item.href} active={isActive(pathname, item.href)} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Small, flat, and only where a label alone would not be scannable at a glance. */
function NavIcon({ href, active }: { href: string; active: boolean }) {
  const stroke = active ? 'currentColor' : 'currentColor';
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: active ? 2 : 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (href) {
    case '/':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case '/ideas':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m15 9-2.2 5.2L7.6 16.4 9.8 11z" />
        </svg>
      );
    case '/events':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
        </svg>
      );
    case '/post':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8.5v7M8.5 12h7" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="3.5" />
          <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" />
        </svg>
      );
  }
}
