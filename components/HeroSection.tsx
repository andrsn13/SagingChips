'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Instagram } from 'lucide-react';
import heroBg from '@/public/assets/hero/hero-bg.png';
import crunchCultTitle from '@/public/assets/hero/crunch-cult-title.png';

interface HeroSectionProps {
  onOrderClick: () => void;
}

export function HeroSection({ onOrderClick }: HeroSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const heroRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Multi-depth physical parallax separating background scene and foreground title stack
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.07]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -32]);

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-[#9D3E0B] via-[#883308] to-[#5F2004] text-[#FFFDF8]"
    >
      {/* Desktop full-bleed hero artwork background with scroll-depth parallax */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: bgY, scale: bgScale }}
        className="pointer-events-none absolute inset-0 hidden will-change-transform md:block"
      >
        <Image
          src={heroBg}
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 100vw, 1px"
          className="object-cover object-[72%_center] lg:object-center"
          referrerPolicy="no-referrer"
        />
        {/* Gentle left-side contrast scrim so text stays sharp across all desktop widths */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#5E2004]/65 via-[#7A2C07]/25 to-transparent lg:from-[#5E2004]/35 lg:via-transparent"
        />
      </motion.div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-6 pt-24 sm:px-6 md:flex md:min-h-[560px] md:items-center md:pb-24 md:pt-28 lg:min-h-[600px] lg:px-8 lg:pb-28 lg:pt-32">
        <motion.div
          style={prefersReducedMotion ? undefined : { y: copyY }}
          className="max-w-lg space-y-5 will-change-transform"
        >
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.04 }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FDE68A] sm:text-sm"
          >
            Saging Chips <span aria-hidden="true">·</span> Antipolo City
          </motion.p>

          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
            className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px]"
          >
            <span className="sr-only">Crunch Cult — Saging Banana Chips</span>
            <Image
              src={crunchCultTitle}
              alt="Crunch Cult"
              priority
              sizes="(max-width: 640px) 340px, (max-width: 1024px) 420px, 460px"
              className="h-auto w-full drop-shadow-md"
              referrerPolicy="no-referrer"
            />
          </motion.h1>

          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.16 }}
            className="max-w-sm text-sm font-semibold uppercase tracking-[0.12em] leading-relaxed text-[#FFF9F0] drop-shadow-xs sm:text-base"
          >
            Real banana. Real crunch. Irresistible flavor.
          </motion.p>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.22 }}
            className="flex flex-wrap items-center gap-4 pt-1"
          >
            <motion.button
              type="button"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              onClick={onOrderClick}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#FFF9F0] px-6 py-3.5 text-sm font-bold text-[#3B1A0A] shadow-lg transition-colors duration-150 hover:bg-[#F6C21C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer sm:text-base"
            >
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>Order on Instagram</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </motion.button>

            <motion.a
              href="#flavors"
              whileHover={prefersReducedMotion ? undefined : { x: 2 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="inline-flex items-center gap-1.5 px-2 py-2.5 text-sm font-semibold text-[#FBEBD6] underline decoration-[#F6C21C]/70 underline-offset-4 transition-colors hover:text-[#F6C21C] focus-visible:outline-2 focus-visible:outline-[#F6C21C] rounded-sm min-h-[44px] whitespace-nowrap shrink-0"
            >
              <span>See all 4 flavors</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Hero Visual Strip: showcases the pouch & overflowing chip bowl cleanly up to the wave */}
      <div className="relative z-10 md:hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={heroBg}
            alt="Saging Banana Chips pouch pouring crispy golden banana chips into a dark bowl"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 1px"
            className="object-cover object-[80%_center]"
            referrerPolicy="no-referrer"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#7E2E07] to-transparent"
          />
        </div>
      </div>
    </section>
  );
}
