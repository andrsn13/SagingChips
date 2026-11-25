'use client';

import { useState } from 'react';
import { ArrowRight, Instagram, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOrderClick: () => void;
}

const NAV_LINKS = [
  { label: 'Flavors', href: '#flavors' },
  { label: 'Why Saging', href: '#why-saging' },
  { label: 'Perfect For', href: '#perfect-for' },
  { label: 'Resellers', href: '#resellers' },
  { label: 'About', href: '#about' },
] as const;

export function Navbar({ onOrderClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30 w-full bg-gradient-to-b from-[#3B1303]/75 via-[#3B1303]/30 to-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFFDF8] drop-shadow-sm whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6C21C] rounded-sm"
        >
          Saging
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#FFF9F0]/95 drop-shadow-xs"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#F6C21C] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6C21C] rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 outlined pill CTA matching mockup + menu toggle on mobile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOrderClick}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/80 bg-[#3B1303]/30 px-5 py-2 text-sm font-semibold text-[#FFFDF8] backdrop-blur-xs transition-colors duration-150 hover:border-[#FFF9F0] hover:bg-[#FFF9F0] hover:text-[#3B1A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            <span>Order on Instagram</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/25 bg-[#3B1303]/40 p-2.5 text-[#FFFDF8] backdrop-blur-xs hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#F6C21C] min-h-[44px] min-w-[44px] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-white/15 bg-[#6E2706]/95 px-4 py-4 space-y-2 backdrop-blur-md shadow-xl"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-[#FBEBD6] hover:bg-white/10 hover:text-[#F6C21C] min-h-[44px]"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOrderClick();
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF9F0] px-5 py-3 text-sm font-semibold text-[#3B1A0A] min-h-[44px] cursor-pointer"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            <span>Order on Instagram</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </header>
  );
}
