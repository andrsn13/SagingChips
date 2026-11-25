'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Move3d, RotateCcw } from 'lucide-react';
import { FLAVORS, type FlavorItem } from '@/lib/catalog';
import { formatPhpPrice, type FlavorId } from '@/lib/order-helpers';
import { FlavorStage3D } from './FlavorStage3D';

interface FlavorsSectionProps {
  onSelectFlavor: (flavorId: FlavorId) => void;
}

const DEFAULT_FOCUSED_INDEX = 1; // Center-weighted start on Sour Cream

export function FlavorsSection({ onSelectFlavor }: FlavorsSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  // Default focus begins near center so the overlapping fan pyramids cleanly on initial view
  const [focusedIndex, setFocusedIndex] = useState<number>(DEFAULT_FOCUSED_INDEX);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [isSpun, setIsSpun] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  const activeFlavor: FlavorItem = FLAVORS[focusedIndex] ?? FLAVORS[0];

  const handleFocusIndex = useCallback((index: number) => {
    setFocusedIndex((prev) => (prev === index ? prev : index));
  }, []);

  const handleWebGLUnavailable = useCallback(() => {
    setWebglUnavailable(true);
  }, []);

  const handleResetSpin = useCallback(() => {
    setResetSignal((n) => n + 1);
    setIsSpun(false);
  }, []);

  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleFocusIndex((index + 1) % FLAVORS.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleFocusIndex((index - 1 + FLAVORS.length) % FLAVORS.length);
    }
  };

  return (
    <section
      id="flavors"
      data-active-flavor={activeFlavor.id}
      className="relative scroll-mt-16 overflow-hidden bg-[#FBEBD6] pt-3 pb-16 sm:pt-5 sm:pb-20 lg:pt-6 lg:pb-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header always visible so it peeks invitingly below the Hero wave */}
        <div className="mx-auto max-w-2xl space-y-2.5 text-center">
          <div className="flex items-center justify-center gap-4">
            <span aria-hidden="true" className="h-px w-12 bg-[#AF4D10]/30 sm:w-20" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#AF4D10] sm:text-sm">
              Our Flavors
            </p>
            <span aria-hidden="true" className="h-px w-12 bg-[#AF4D10]/30 sm:w-20" />
          </div>

          <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-4xl lg:text-5xl">
            Find Your Favorite
          </h2>

          <p className="text-balance text-base text-[#5C3118]">
            Four crowd-favorite coatings over crispy caramelized banana chips, packed fresh in 70 g zip pouches.
          </p>

          {!webglUnavailable && !prefersReducedMotion && (
            <p className="inline-flex items-center justify-center gap-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8E3C0A]">
              <Move3d className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hover or tap a pouch to focus · Drag to spin 360°</span>
            </p>
          )}
        </div>

        {/* Interactive 3D Overlapping Fan Stage (or Reduced-Motion / Fallback Fan) */}
        <div className="relative mt-6 sm:mt-8">
          {/* Decorative outward crunch dashes positioned safely outside the WebGL canvas */}
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="pointer-events-none absolute -left-4 top-36 hidden flex-col items-end gap-4 xl:flex"
          >
            <span className="block h-1.5 w-7 rotate-[26deg] rounded-full bg-[#F6C21C]" />
            <span className="block h-1.5 w-5 -rotate-[16deg] rounded-full bg-[#E8730C]/85" />
          </motion.div>

          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="pointer-events-none absolute -right-4 top-36 hidden flex-col items-start gap-4 xl:flex"
          >
            <span className="block h-1.5 w-7 -rotate-[26deg] rounded-full bg-[#F6C21C]" />
            <span className="block h-1.5 w-5 rotate-[16deg] rounded-full bg-[#E8730C]/85" />
          </motion.div>

          {!webglUnavailable && !prefersReducedMotion ? (
            <FlavorStage3D
              flavors={FLAVORS}
              focusedIndex={focusedIndex}
              resetSignal={resetSignal}
              prefersReducedMotion={prefersReducedMotion}
              onFocusIndex={handleFocusIndex}
              onSpinStateChange={setIsSpun}
              onWebGLUnavailable={handleWebGLUnavailable}
            />
          ) : (
            /* Graceful overlapping fan fallback for reduced-motion or headless software without WebGL */
            <div className="mx-auto flex max-w-4xl items-center justify-center py-8">
              {FLAVORS.map((flavor, idx) => {
                const dist = idx - focusedIndex;
                const absDist = Math.abs(dist);
                const isFocused = absDist === 0;
                const zClass = isFocused ? 'z-30' : absDist === 1 ? 'z-20' : 'z-10';
                const scaleStyle = isFocused ? 1.1 : Math.max(0.84, 0.96 - (absDist - 1) * 0.06);
                const rotateDeg = isFocused ? 0 : -Math.sign(dist) * (6 + (absDist - 1) * 3);

                return (
                  <button
                    key={flavor.id}
                    type="button"
                    onMouseEnter={() => handleFocusIndex(idx)}
                    onClick={() => handleFocusIndex(idx)}
                    aria-label={`Focus ${flavor.name}`}
                    style={{
                      transform: `scale(${scaleStyle}) rotate(${rotateDeg}deg)`,
                    }}
                    className={`relative -mx-4 w-[130px] sm:-mx-6 sm:w-[210px] aspect-[3/4] overflow-hidden rounded-3xl bg-[#F3E2C1] shadow-xl ring-1 ring-[#3B1A0A]/12 transition-transform duration-300 cursor-pointer ${zClass}`}
                  >
                    <Image
                      src={flavor.image}
                      alt={flavor.alt}
                      fill
                      sizes="(max-width: 640px) 130px, 210px"
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive 4-Flavor Selector Bar (Syncs bidirectionally with 3D fan) */}
        <div
          role="tablist"
          aria-label="Saging Chips flavors"
          className="mx-auto mt-2 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {FLAVORS.map((flavor, idx) => {
            const isSelected = idx === focusedIndex;
            return (
              <button
                key={flavor.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-flavor-tab={flavor.id}
                onMouseEnter={() => handleFocusIndex(idx)}
                onFocus={() => handleFocusIndex(idx)}
                onClick={() => handleFocusIndex(idx)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF4D10] ${
                  isSelected
                    ? 'text-[#FFFDF8]'
                    : 'border border-[#3B1A0A]/15 bg-[#FFF9F0]/80 text-[#3B1A0A] hover:border-[#AF4D10]/50 hover:bg-[#FFF9F0]'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="active-flavor-tab-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-[#3B1A0A] shadow-md"
                    aria-hidden="true"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 h-2.5 w-2.5 rounded-full ring-1 ring-black/15"
                  style={{ backgroundColor: flavor.accentHex }}
                />
                <span className="relative z-10 whitespace-nowrap">{flavor.name}</span>
              </button>
            );
          })}
        </div>

        {/* Focused Flavor Spotlight Details & Action */}
        <div className="mx-auto mt-7 max-w-xl text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFlavor.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="space-y-3"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-3xl">
                  {activeFlavor.name}
                </h3>
                <span aria-hidden="true" className="text-[#AF4D10]/50">
                  ·
                </span>
                <p className="text-sm font-bold text-[#8E3C0A] tabular-nums sm:text-base">
                  {formatPhpPrice(activeFlavor.pricePhp)} · {activeFlavor.weightGrams} g · {activeFlavor.pouchColorLabel}
                </p>
              </div>

              <div
                aria-hidden="true"
                className="mx-auto h-0.5 w-14 rounded-full"
                style={{ backgroundColor: activeFlavor.accentHex }}
              />

              <p className="mx-auto max-w-[44ch] text-sm leading-relaxed text-[#4E2813] sm:text-base">
                {activeFlavor.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              onClick={() => onSelectFlavor(activeFlavor.id)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#AF4D10] px-7 py-3 text-sm font-bold text-[#FFFDF8] shadow-md transition-colors duration-150 hover:bg-[#8E3C0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF4D10] min-h-[44px] whitespace-nowrap cursor-pointer sm:text-base"
            >
              <span>Order {activeFlavor.name}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </motion.button>

            {isSpun && !webglUnavailable && !prefersReducedMotion && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleResetSpin}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#3B1A0A]/20 bg-[#FFF9F0] px-4 py-2.5 text-xs font-semibold text-[#3B1A0A] hover:border-[#AF4D10] min-h-[44px] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset angle</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
