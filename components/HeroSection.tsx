'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Instagram } from 'lucide-react';
import { HERO_MEDIA } from '@/lib/catalog';

interface HeroSectionProps {
  onOrderClick: () => void;
}

export function HeroSection({ onOrderClick }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-[#BD4E0E] via-[#9D3E0B] to-[#6E2706] text-[#FFFDF8]"
    >
      {/* Subtle warm radial glow behind the hero centerpiece */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[#F6C21C]/20 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-32 lg:pt-20">
        {/* Left column: Headline, value prop, primary CTA */}
        <div className="relative z-10 lg:col-span-6 space-y-6">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#FDE68A]">
            Saging Chips · Antipolo City
          </p>

          <h1 className="font-display text-balance text-5xl font-black uppercase leading-[0.94] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block text-[#FFFDF8] drop-shadow-sm">Crunch</span>
            <span className="block text-[#F6C21C] drop-shadow-sm">Cult</span>
          </h1>

          <p className="max-w-md text-base sm:text-lg font-medium leading-relaxed text-[#FBEBD6]">
            Real banana. Real crunch. Irresistible flavor. Double-sealed 70g packs crafted for every craving.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onOrderClick}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#FFF9F0] px-6 py-3.5 text-sm sm:text-base font-bold text-[#3B1A0A] shadow-lg transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#F6C21C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>Order on Instagram</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>

            <a
              href="#flavors"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm sm:text-base font-semibold text-[#FBEBD6] underline decoration-[#F6C21C]/60 underline-offset-4 transition-colors hover:text-[#F6C21C] focus-visible:outline-2 focus-visible:outline-[#F6C21C] rounded-sm min-h-[44px] whitespace-nowrap shrink-0"
            >
              <span>See all 4 flavors</span>
            </a>
          </div>

          <p className="text-xs sm:text-sm text-[#FDE68A]/90 tabular-nums">
            ₱25 per 70 g pack · 4 signature flavors · Ready to eat
          </p>
        </div>

        {/* Right column: Hero product photography centerpiece */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0.9, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 lg:col-span-6"
        >
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15 bg-[#7C2D08]">
            <Image
              src={HERO_MEDIA.image}
              alt={HERO_MEDIA.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
