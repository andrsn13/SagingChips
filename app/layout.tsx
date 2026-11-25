import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Saging Chips — Crunch Cult | Real Banana. Real Crunch.',
  description:
    'Crispy caramelized banana chips made in Antipolo City, Philippines. Explore BBQ, Sour Cream, Cheese, and Ordinary 70g flavors and order via Instagram or Messenger.',
  openGraph: {
    title: 'Saging Chips — Crunch Cult',
    description:
      'Real banana. Real crunch. Irresistible flavor. Crafted in Antipolo City in BBQ, Sour Cream, Cheese, and Ordinary 70g packs.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saging Chips — Crunch Cult',
    description:
      'Real banana. Real crunch. Irresistible flavor. Crafted in Antipolo City in BBQ, Sour Cream, Cheese, and Ordinary 70g packs.',
  },
};

export const viewport: Viewport = {
  themeColor: '#AF4D10',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning className="antialiased selection:bg-[#F6C21C] selection:text-[#3B1A0A]">
        {children}
      </body>
    </html>
  );
}
