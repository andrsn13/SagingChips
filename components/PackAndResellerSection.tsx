'use client';

import { ArrowRight, Clock, Package, ShieldCheck, Store } from 'lucide-react';
import { BRAND_INFO } from '@/lib/order-helpers';

interface PackAndResellerSectionProps {
  onResellerClick: () => void;
}

const PACK_SPECS = [
  {
    label: 'Net Weight',
    value: `${BRAND_INFO.packWeightGrams} g per pouch`,
    detail: BRAND_INFO.packDimensions,
    Icon: Package,
  },
  {
    label: 'Freshness Seal',
    value: 'Double-sealed zip pouch',
    detail: 'Resealable with clear bottom chip window',
    Icon: ShieldCheck,
  },
  {
    label: 'Shelf Life',
    value: BRAND_INFO.shelfLifeSealed,
    detail: `${BRAND_INFO.shelfLifeOpened}, ready to eat`,
    Icon: Clock,
  },
] as const;

export function PackAndResellerSection({ onResellerClick }: PackAndResellerSectionProps) {
  return (
    <section id="resellers" className="bg-[#F5E1C5] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6 lg:px-8">
        {/* Pack Transparency Row */}
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-2 border-b border-[#3B1A0A]/12 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#AF4D10]">
                Inside Every Bag
              </p>
              <h2 className="font-display mt-1 text-2xl font-extrabold text-[#3B1A0A] sm:text-3xl">
                Built for Real Crunch & Freshness
              </h2>
            </div>
            <p className="text-sm text-[#5C3118]">
              Store in a cool, dry place away from direct sunlight.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {PACK_SPECS.map(({ label, value, detail, Icon }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#3B1A0A]/15 bg-[#FFF9F0] text-[#AF4D10]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7A350C]">
                    {label}
                  </p>
                  <p className="font-display text-lg font-bold text-[#3B1A0A] tabular-nums">
                    {value}
                  </p>
                  <p className="text-sm text-[#5C3118] tabular-nums">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reseller Conversion Block */}
        <div className="flex flex-col justify-between gap-8 rounded-3xl border border-[#3B1A0A]/12 bg-[#FFF9F0] p-6 shadow-sm sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#AF4D10]">
              Resellers & Bulk Orders
            </p>
            <h2 className="font-display text-balance text-2xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-3xl">
              Want to Carry Saging Chips?
            </h2>
            <p className="text-base leading-relaxed text-[#4E2813]">
              Stock our 70 g pouches in campus stalls, sari-sari stores, coffee nooks, or local reseller packs. Message us directly for current bulk rates and stock availability.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onResellerClick}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-[#AF4D10] px-6 py-3.5 text-sm sm:text-base font-semibold text-[#FFFDF8] shadow-md transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#8E3C0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF4D10] min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Store className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>Message us about reselling</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
