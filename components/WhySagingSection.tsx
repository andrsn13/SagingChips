'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Heart, Leaf, Smile } from 'lucide-react';
import { WHY_SAGING_MEDIA } from '@/lib/catalog';

const PILLARS = [
  {
    title: 'Made from Real Bananas',
    description: 'Thin-sliced real saba bananas cooked golden for honest crunch in every bite.',
    Icon: Leaf,
  },
  {
    title: 'Irresistibly Crunchy',
    description: 'Sealed right after seasoning so every chip snaps clean from the first handful to the last.',
    Icon: Smile,
  },
  {
    title: 'Perfect for Any Moment',
    description: 'Resealable 70 g zip pouch slips into backpacks, desk drawers, and gloveboxes.',
    Icon: Heart,
  },
] as const;

export function WhySagingSection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const macroScale = useTransform(scrollYProgress, [0, 0.55, 1], [1.1, 1.01, 1.04]);
  const macroTilt = useTransform(scrollYProgress, [0, 1], [-1.5, 1.0]);

  return (
    <section
      ref={sectionRef}
      id="why-saging"
      className="scroll-mt-20 bg-[#FBEBD6] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl items-stretch gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        {/* Left: Scroll-scrubbed Macro Crunch Visual */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="lg:col-span-6"
        >
          <div className="group relative aspect-[4/3] h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#240E05] shadow-xl">
            <motion.div
              style={
                prefersReducedMotion
                  ? undefined
                  : { scale: macroScale, rotate: macroTilt }
              }
              className="relative h-full w-full will-change-transform"
            >
              <Image
                src={WHY_SAGING_MEDIA.image}
                alt={WHY_SAGING_MEDIA.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Story & Staggered Spring Pillars */}
        <div className="flex flex-col justify-center space-y-6 lg:col-span-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#AF4D10] sm:text-sm">
              Why Saging?
            </p>
            <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-4xl">
              More Than Just a Snack
            </h2>
            <p className="text-base leading-relaxed text-[#4E2813]">
              Saging Chips brings you the perfect crunch made from real bananas. A snack that&apos;s simple, delicious, and always satisfying.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 border-t border-[#3B1A0A]/12 pt-6 sm:grid-cols-3">
            {PILLARS.map(({ title, description, Icon }, idx) => (
              <motion.div
                key={title}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 22,
                  delay: idx * 0.08,
                }}
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                className="group space-y-2.5"
              >
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { rotate: -8, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3B1A0A]/15 bg-[#FFF9F0] text-[#AF4D10] shadow-2xs transition-colors group-hover:border-[#AF4D10] group-hover:bg-[#AF4D10] group-hover:text-[#FFFDF8]"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </motion.div>
                <h3 className="font-display text-base font-bold text-[#3B1A0A]">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-[#5C3118] sm:text-sm">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
