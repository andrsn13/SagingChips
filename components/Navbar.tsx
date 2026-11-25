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
    <header className="relative z-30 w-full bg-[#9D3E0B]/95 backdrop-blur-sm border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFFDF8] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6C21C] rounded-sm"
        >
          Saging
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#FBEBD6]"
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

        {/* Zone 3: 1 primary CTA on desktop + menu toggle on mobile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOrderClick}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-[#FFF9F0] px-5 py-2.5 text-sm font-semibold text-[#3B1A0A] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#F6C21C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] whitespace-nowrap shrink-0 cursor-pointer"
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
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/20 p-2.5 text-[#FFFDF8] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#F6C21C] min-h-[44px] min-w-[44px] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-white/10 bg-[#873409] px-4 py-4 space-y-2"
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
