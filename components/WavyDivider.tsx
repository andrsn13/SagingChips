'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

export function WaveOrangeToCream() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const waveRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: waveRef,
    offset: ['start end', 'end start'],
  });
  const xShift = useTransform(scrollYProgress, [0, 1], [-22, 22]);

  return (
    <div
      ref={waveRef}
      className="relative z-20 -mt-12 w-full overflow-hidden leading-none bg-transparent sm:-mt-16 md:-mt-20"
      aria-hidden="true"
    >
      <motion.div
        style={prefersReducedMotion ? undefined : { x: xShift }}
        className="relative -left-[4%] w-[108%] will-change-transform"
      >
        <svg
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
          className="block h-12 w-full sm:h-16 md:h-20"
        >
          <path
            d="M0,42 C240,92 480,12 720,46 C960,80 1200,18 1440,54 L1440,96 L0,96 Z"
            fill="#FBEBD6"
          />
        </svg>
      </motion.div>
    </div>
  );
}

export function WaveCreamToDarkCocoa() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const waveRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: waveRef,
    offset: ['start end', 'end start'],
  });
  const xShift = useTransform(scrollYProgress, [0, 1], [18, -18]);

  return (
    <div ref={waveRef} className="w-full overflow-hidden leading-none bg-[#F5E1C5]" aria-hidden="true">
      <motion.div
        style={prefersReducedMotion ? undefined : { x: xShift }}
        className="relative -left-[4%] w-[108%] will-change-transform"
      >
        <svg
          viewBox="0 0 1440 84"
          preserveAspectRatio="none"
          className="block h-10 w-full sm:h-14 md:h-16"
        >
          <path
            d="M0,36 C320,84 640,4 960,42 C1160,64 1320,28 1440,18 L1440,84 L0,84 Z"
            fill="#3B1A0A"
          />
        </svg>
      </motion.div>
    </div>
  );
}
