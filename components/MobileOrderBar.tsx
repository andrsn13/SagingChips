'use client';

import { ArrowRight, Instagram } from 'lucide-react';
import { BRAND_INFO, formatPhpPrice } from '@/lib/order-helpers';

interface MobileOrderBarProps {
  onOrderClick: () => void;
}

export function MobileOrderBar({ onOrderClick }: MobileOrderBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3B1A0A]/15 bg-[#FFF9F0]/95 px-4 py-2.5 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-[#3B1A0A]">
            {BRAND_INFO.brandName}
          </p>
          <p className="text-xs font-medium text-[#7A350C] tabular-nums">
            {formatPhpPrice(BRAND_INFO.defaultPricePhp)} <span aria-hidden="true">·</span> {BRAND_INFO.packWeightGrams} g
          </p>
        </div>

        <button
          type="button"
          onClick={onOrderClick}
          className="inline-flex items-center gap-2 rounded-full bg-[#AF4D10] px-4 py-2.5 text-xs font-semibold text-[#FFFDF8] shadow-sm active:scale-95 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Order Now</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
