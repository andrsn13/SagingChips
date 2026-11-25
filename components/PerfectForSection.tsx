'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Briefcase, Car, GraduationCap } from 'lucide-react';
import { OCCASION_POLAROIDS } from '@/lib/catalog';

const OCCASIONS = [
  { label: 'School', polaroidId: 'study', Icon: GraduationCap },
  { label: 'Work', polaroidId: 'study', Icon: Briefcase },
  { label: 'Road Trips', polaroidId: 'road-trip', Icon: Car },
] as const;

export function PerfectForSection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hoveredPolaroid, setHoveredPolaroid] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  });

  // Parabolic fan-out transforms on scroll entry
  const leftRotate = useTransform(scrollYProgress, [0, 1], [2, -4]);
  const leftX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const centerY = useTransform(scrollYProgress, [0, 1], [16, -12]);
  const rightRotate = useTransform(scrollYProgress, [0, 1], [-2, 4]);
  const rightX = useTransform(scrollYProgress, [0, 1], [-16, 0]);

  return (
    <section
      ref={sectionRef}
      id="perfect-for"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-[#FBEBD6] via-[#FBEBD6] to-[#F5E1C5] py-16 sm:py-20 lg:py-24"
    >
      {/* Warm burnt-orange organic wave backdrop strictly behind the right polaroid showcase on desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[48%] rounded-t-[56px] bg-[#C85A14] lg:left-[45%] lg:top-10 lg:rounded-tl-[120px] lg:rounded-tr-none"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        {/* Left column: Occasion Copy & Bidirectional Interactive Badges */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="space-y-6 rounded-3xl bg-[#FBEBD6] p-6 sm:p-8 lg:col-span-5 lg:bg-transparent lg:p-0 lg:pr-4"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#AF4D10] sm:text-sm">
              Perfect For
            </p>
            <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-4xl">
              Any Day, Any Adventure
            </h2>
            <p className="text-base leading-relaxed text-[#4E2813]">
              Whether you&apos;re studying, working, or on the go — Saging Chips is your easy, crunchy snack companion.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-[#3B1A0A]/12 pt-5">
            {OCCASIONS.map(({ label, polaroidId, Icon }) => {
              const isLinked = hoveredPolaroid === polaroidId;
              return (
                <motion.button
                  key={label}
                  type="button"
                  onMouseEnter={() => setHoveredPolaroid(polaroidId)}
                  onMouseLeave={() => setHoveredPolaroid(null)}
                  onFocus={() => setHoveredPolaroid(polaroidId)}
                  onBlur={() => setHoveredPolaroid(null)}
                  whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="flex flex-col items-start gap-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#AF4D10] rounded-lg"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 ${
                      isLinked
                        ? 'border-[#AF4D10] bg-[#AF4D10] text-[#FFFDF8] shadow-sm'
                        : 'border-[#3B1A0A]/15 bg-[#FFF9F0] text-[#3B1A0A]'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-[#3B1A0A] whitespace-nowrap">
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Right column: 3 Polaroid Lifestyle Cards with Scroll Fan-Out & Hover Snap */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
            {OCCASION_POLAROIDS.map((item, idx) => {
              const isActive = hoveredPolaroid === item.id;
              const scrollStyle = prefersReducedMotion
                ? undefined
                : idx === 0
                  ? { rotate: leftRotate, x: leftX }
                  : idx === 1
                    ? { y: centerY }
                    : { rotate: rightRotate, x: rightX };

              return (
                <motion.figure
                  key={item.id}
                  style={scrollStyle}
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : isActive
                        ? { scale: 1.06, y: -14, rotate: 0 }
                        : { scale: 1 }
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.06, y: -14, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  onMouseEnter={() => setHoveredPolaroid(item.id)}
                  onMouseLeave={() => setHoveredPolaroid(null)}
                  className={`relative rounded-lg bg-[#FFFDF9] p-2.5 pb-4 shadow-xl ring-1 ring-black/10 will-change-transform cursor-pointer ${
                    isActive ? 'z-20 shadow-2xl ring-[#F6C21C]/70' : 'z-10'
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-[#E8D5BE]">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <figcaption className="mt-3 text-center font-display text-sm font-bold text-[#3B1A0A]">
                    {item.caption}
                  </figcaption>
                </motion.figure>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
