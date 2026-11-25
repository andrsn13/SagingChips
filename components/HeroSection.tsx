'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowRight, Instagram } from 'lucide-react';
import heroBg from '@/public/assets/hero/hero-bg.png';
import crunchCultTitle from '@/public/assets/hero/crunch-cult-title.png';
import chipAccent from '@/public/assets/hero/chip-accent-1.png';

interface HeroSectionProps {
  onOrderClick: () => void;
}

const POINTER_SPRING = { stiffness: 140, damping: 22, mass: 0.7 };
const CTA_SPRING = { stiffness: 320, damping: 22, mass: 0.5 };

export function HeroSection({ onOrderClick }: HeroSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const heroRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Normalized pointer coordinates [-1, 1] piped through smooth spring physics (zero React re-renders)
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);
  const pointerX = useSpring(rawPointerX, POINTER_SPRING);
  const pointerY = useSpring(rawPointerY, POINTER_SPRING);

  // Magnetic pull motion values for the primary CTA
  const rawCtaX = useMotionValue(0);
  const rawCtaY = useMotionValue(0);
  const ctaPullX = useSpring(rawCtaX, CTA_SPRING);
  const ctaPullY = useSpring(rawCtaY, CTA_SPRING);

  // Far plane: gentle counter-parallax + vertical scroll drift (no zoom blur)
  const bgScrollY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const bgPointerX = useTransform(pointerX, [-1, 1], [14, -14]);
  const bgPointerY = useTransform(pointerY, [-1, 1], [9, -9]);

  // Mid plane: subtle 3D perspective tilt + forward spatial shift
  const copyScrollY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const copyPointerX = useTransform(pointerX, [-1, 1], [-9, 9]);
  const copyPointerY = useTransform(pointerY, [-1, 1], [-6, 6]);
  const copyRotateX = useTransform(pointerY, [-1, 1], [2.4, -2.4]);
  const copyRotateY = useTransform(pointerX, [-1, 1], [-3.2, 3.2]);

  // Near plane: floating banana chip accents move with 2.2x differential parallax + scroll float
  const chipNearX = useTransform(pointerX, [-1, 1], [-24, 24]);
  const chipNearY = useTransform(pointerY, [-1, 1], [-17, 17]);
  const chipDeepX = useTransform(pointerX, [-1, 1], [-18, 18]);
  const chipDeepY = useTransform(pointerY, [-1, 1], [-12, 12]);
  const chipScrollDrift = useTransform(scrollYProgress, [0, 1], [0, -36]);

  const handleHeroPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (prefersReducedMotion || e.pointerType !== 'mouse') return;
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      rawPointerX.set(Math.max(-1, Math.min(1, nx)));
      rawPointerY.set(Math.max(-1, Math.min(1, ny)));
    },
    [prefersReducedMotion, rawPointerX, rawPointerY]
  );

  const handleHeroPointerLeave = useCallback(() => {
    rawPointerX.set(0);
    rawPointerY.set(0);
  }, [rawPointerX, rawPointerY]);

  const handleCtaPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (prefersReducedMotion || e.pointerType !== 'mouse') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      rawCtaX.set(nx * 5);
      rawCtaY.set(ny * 4);
    },
    [prefersReducedMotion, rawCtaX, rawCtaY]
  );

  const handleCtaPointerLeave = useCallback(() => {
    rawCtaX.set(0);
    rawCtaY.set(0);
  }, [rawCtaX, rawCtaY]);

  return (
    <section
      ref={heroRef}
      id="top"
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative overflow-hidden bg-gradient-to-br from-[#9D3E0B] via-[#883308] to-[#5F2004] text-[#FFFDF8]"
    >
      {/* Far Plane: crisp q=100 custom hero artwork with static 1.03 overscan & pointer counter-parallax */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: bgScrollY }}
        className="pointer-events-none absolute -top-4 inset-x-0 bottom-0 hidden md:block"
      >
        <motion.div
          style={prefersReducedMotion ? undefined : { x: bgPointerX, y: bgPointerY }}
          className="relative h-full w-full scale-[1.03]"
        >
          <Image
            src={heroBg}
            alt=""
            fill
            priority
            quality={100}
            sizes="(min-width: 768px) 100vw, 1px"
            className="object-cover object-[72%_center] lg:object-center"
            referrerPolicy="no-referrer"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#5E2004]/60 via-[#7A2C07]/20 to-transparent lg:from-[#5E2004]/30 lg:via-transparent"
          />
        </motion.div>
      </motion.div>

      {/* Near Accent Plane (Desktop): real golden banana chip slices floating along quiet outer margins */}
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { y: chipScrollDrift }}
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
      >
        {/* Top-mid open sky chip */}
        <motion.div
          style={prefersReducedMotion ? undefined : { x: chipDeepX, y: chipDeepY }}
          className="absolute left-[43%] top-[14%] lg:left-[45%]"
        >
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [-5, 6, -5], rotate: [-14, -7, -14] }
            }
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-11 drop-shadow-[0_10px_16px_rgba(45,14,2,0.45)] lg:w-13"
          >
            <Image
              src={chipAccent}
              alt=""
              width={195}
              height={161}
              sizes="64px"
              className="h-auto w-full opacity-95"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>

        {/* Bottom-left lower corner near wave */}
        <motion.div
          style={prefersReducedMotion ? undefined : { x: chipNearX, y: chipNearY }}
          className="absolute bottom-[15%] left-[2.5%] lg:left-[3.5%]"
        >
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [4, -7, 4], rotate: [22, 30, 22] }
            }
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="w-11 drop-shadow-[0_12px_18px_rgba(45,14,2,0.5)] lg:w-14"
          >
            <Image
              src={chipAccent}
              alt=""
              width={195}
              height={161}
              sizes="64px"
              className="h-auto w-full -scale-x-100 opacity-90"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>

        {/* Top-right perimeter chip */}
        <motion.div
          style={prefersReducedMotion ? undefined : { x: chipNearX, y: chipNearY }}
          className="absolute right-[2.5%] top-[14%] lg:right-[3.5%]"
        >
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [-6, 5, -6], rotate: [16, 25, 16] }
            }
            transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
            className="w-12 drop-shadow-[0_12px_18px_rgba(45,14,2,0.45)] lg:w-15"
          >
            <Image
              src={chipAccent}
              alt=""
              width={195}
              height={161}
              sizes="64px"
              className="h-auto w-full opacity-95"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>

        {/* Bottom-right outer rim near wave */}
        <motion.div
          style={prefersReducedMotion ? undefined : { x: chipDeepX, y: chipDeepY }}
          className="absolute bottom-[17%] right-[4%] lg:right-[5%]"
        >
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [5, -5, 5], rotate: [-28, -19, -28] }
            }
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.3 }}
            className="w-10 drop-shadow-[0_10px_14px_rgba(45,14,2,0.45)] lg:w-12"
          >
            <Image
              src={chipAccent}
              alt=""
              width={195}
              height={161}
              sizes="56px"
              className="h-auto w-full -scale-x-100 opacity-85"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Mid Plane: 3D perspective stage for Crunch Cult title, tagline & magnetic CTA */}
      <div className="relative z-20 mx-auto max-w-6xl px-4 pb-6 pt-22 sm:px-6 md:flex md:min-h-[500px] md:items-center md:pb-20 md:pt-24 lg:min-h-[540px] lg:px-8 lg:pb-24 lg:pt-28 perspective-[1100px]">
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : {
                  y: copyScrollY,
                  x: copyPointerX,
                  translateY: copyPointerY,
                  rotateX: copyRotateX,
                  rotateY: copyRotateY,
                  transformStyle: 'preserve-3d',
                }
          }
          className="max-w-lg space-y-5"
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
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
            className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px]"
          >
            <span className="sr-only">Crunch Cult — Saging Banana Chips</span>
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <Image
                src={crunchCultTitle}
                alt="Crunch Cult"
                priority
                quality={100}
                sizes="(max-width: 640px) 340px, (max-width: 1024px) 420px, 460px"
                className="h-auto w-full drop-shadow-[0_10px_20px_rgba(45,14,2,0.38)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
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
              style={prefersReducedMotion ? undefined : { x: ctaPullX, y: ctaPullY }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              onPointerMove={handleCtaPointerMove}
              onPointerLeave={handleCtaPointerLeave}
              onClick={onOrderClick}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-[#FFF9F0] px-6 py-3.5 text-sm font-bold text-[#3B1A0A] shadow-lg transition-colors duration-150 hover:bg-[#F6C21C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer sm:text-base"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 transition-all duration-500 group-hover:left-[120%] group-hover:opacity-100"
              />
              <Instagram className="relative z-10 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span className="relative z-10">Order on Instagram</span>
              <ArrowRight
                className="relative z-10 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 sm:h-5 sm:w-5"
                aria-hidden="true"
              />
            </motion.button>

            <motion.a
              href="#flavors"
              whileHover={prefersReducedMotion ? undefined : { x: 3 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="inline-flex items-center gap-1.5 px-2 py-2.5 text-sm font-semibold text-[#FBEBD6] underline decoration-[#F6C21C]/70 underline-offset-4 transition-colors hover:text-[#F6C21C] focus-visible:outline-2 focus-visible:outline-[#F6C21C] rounded-sm min-h-[44px] whitespace-nowrap shrink-0"
            >
              <span>See all 4 flavors</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Hero Visual Strip: crisp q=100 + subtle floating chip accents */}
      <div className="relative z-10 md:hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={heroBg}
            alt="Saging Banana Chips pouch pouring crispy golden banana chips into a dark bowl"
            fill
            priority
            quality={100}
            sizes="(max-width: 767px) 100vw, 1px"
            className="object-cover object-[80%_center]"
            referrerPolicy="no-referrer"
          />
          <motion.div
            aria-hidden="true"
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [-4, 4, -4], rotate: [-14, -7, -14] }
            }
            transition={{ duration: 4.3, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute left-4 top-6 w-10 drop-shadow-md"
          >
            <Image
              src={chipAccent}
              alt=""
              width={195}
              height={161}
              sizes="48px"
              className="h-auto w-full opacity-90"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#7E2E07] to-transparent"
          />
        </div>
      </div>
    </section>
  );
}
