'use client';

import { useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';
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
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const next = latest > 64;
    setIsScrolled((prev) => (prev === next ? prev : next));
  });

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 w-full transition-colors duration-300 ${
        isScrolled
          ? 'bg-[#3B1303]/90 shadow-lg backdrop-blur-md'
          : 'bg-gradient-to-b from-[#3B1303]/75 via-[#3B1303]/30 to-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark with subtle spring tap */}
        <motion.a
          href="#top"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="font-display text-2xl font-extrabold tracking-tight text-[#FFFDF8] drop-shadow-sm whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6C21C] rounded-sm sm:text-3xl"
        >
          Saging
        </motion.a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#FFF9F0]/95 drop-shadow-xs"
        >
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
              transition={{ type: 'spring', stiffness: 420, damping: 25 }}
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#F6C21C] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6C21C] rounded-sm"
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        {/* Zone 3: Outlined pill CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            type="button"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            onClick={onOrderClick}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/80 bg-[#3B1303]/35 px-5 py-2 text-sm font-semibold text-[#FFFDF8] backdrop-blur-xs transition-colors duration-150 hover:border-[#FFF9F0] hover:bg-[#FFF9F0] hover:text-[#3B1A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            <span>Order on Instagram</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </motion.button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/25 bg-[#3B1303]/45 p-2.5 text-[#FFFDF8] backdrop-blur-xs hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#F6C21C] min-h-[44px] min-w-[44px] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Scroll-coupled reading progress hairline */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
          className={`h-[2px] w-full bg-gradient-to-r from-[#F6C21C] via-[#FDE68A] to-[#E8730C] transition-opacity duration-200 ${
            isScrolled ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Animated mobile navigation drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            aria-label="Mobile navigation"
            className="md:hidden border-t border-white/15 bg-[#5E2004]/95 px-4 py-4 space-y-2 backdrop-blur-md shadow-xl"
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
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
