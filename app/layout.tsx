import type { Metadata, Viewport } from 'next';
import { Figtree } from 'next/font/google';
import type { ReactNode } from 'react';
import { ControlStrip } from '@/components/trip/ControlStrip';
import './globals.css';

/**
 * One family, self-hosted by next/font.
 *
 * Figtree is a geometric sans with a warm, slightly rounded bowl that sits with the illustration
 * rather than against it. Four weights, because the hierarchy here is carried by weight and size
 * rather than by a second typeface: 400 body, 500 secondary, 700 titles, 800 the hero and the
 * total.
 *
 * No serif, script or handwritten face anywhere in this product.
 */
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhereTo',
  description:
    'What a weekend out of Los Angeles actually costs — travel, beds, the car and the fuel, split between the people going.',
};

export const viewport: Viewport = {
  // Cream, so the browser chrome on mobile matches the page rather than framing it.
  themeColor: '#f8f2e6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} h-full`}>
      <body className="min-h-full">
        {/* Persistent, on every screen, never a modal. Changing a chip repopulates whatever is
            below it in place. */}
        <ControlStrip />
        {children}
      </body>
    </html>
  );
}
