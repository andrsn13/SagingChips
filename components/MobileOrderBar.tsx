'use client';

import { useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'motion/react';
import { ArrowRight, Instagram } from 'lucide-react';
import { BRAND_INFO, formatPhpPrice } from '@/lib/order-helpers';

interface MobileOrderBarProps {
  onOrderClick: () => void;
}

export function MobileOrderBar({ onOrderClick }: MobileOrderBarProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const next = latest > 200;
    setVisible((prev) => (prev === next ? prev : next));
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReducedMotion ? false : { y: 76, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 76, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3B1A0A]/15 bg-[#FFF9F0]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md md:hidden"
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-[#3B1A0A]">
                {BRAND_INFO.brandName}
              </p>
              <p className="text-xs font-medium text-[#7A350C] tabular-nums">
                {formatPhpPrice(BRAND_INFO.defaultPricePhp)} <span aria-hidden="true">·</span> {BRAND_INFO.packWeightGrams} g
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
              onClick={onOrderClick}
              className="inline-flex items-center gap-2 rounded-full bg-[#AF4D10] px-4 py-2.5 text-xs font-semibold text-[#FFFDF8] shadow-sm min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Order Now</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
