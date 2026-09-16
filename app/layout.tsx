import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * One family, self-hosted by next/font.
 *
 * Plus Jakarta Sans is the closest free, self-hostable match to General Sans and Satoshi, which
 * the art direction calls for but which are Fontshare ITF FFL — that licence forbids
 * redistributing the font files, so neither can ship with the app. Jakarta is OFL, variable, and
 * holds the same geometric-humanist character at the tight tracking this direction needs.
 *
 * No mono. The label voice here is tracked-out caps in the same grotesque, and a terminal face
 * would fight the editorial tone.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhereTo',
  description:
    'Weekends out of Los Angeles, priced for who you actually are — your age, your licence, and how many of you are going.',
};

export const viewport: Viewport = {
  // Dark only, so one colour rather than a light/dark pair.
  themeColor: '#16160f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
