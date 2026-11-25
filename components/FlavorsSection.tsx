'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { FLAVORS, type FlavorItem } from '@/lib/catalog';
import { formatPhpPrice, type FlavorId } from '@/lib/order-helpers';

interface FlavorsSectionProps {
  onSelectFlavor: (flavorId: FlavorId) => void;
}

export function FlavorsSection({ onSelectFlavor }: FlavorsSectionProps) {
  return (
    <section id="flavors" className="bg-[#FBEBD6] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#AF4D10]">
            Our Flavors
          </p>
          <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-4xl lg:text-5xl">
            Find Your Favorite
          </h2>
          <p className="text-balance text-base text-[#5C3118]">
            Four crowd-favorite coatings over crispy caramelized banana chips, packed fresh in 70 g zip pouches.
          </p>
        </div>

        {/* 4-Column Flavor Showcase */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FLAVORS.map((flavor: FlavorItem) => (
            <article
              key={flavor.id}
              className="group flex flex-col justify-between"
            >
              <div>
                {/* Studio Pouch Render */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F4DFC1] shadow-sm ring-1 ring-[#3B1A0A]/8 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                  <Image
                    src={flavor.image}
                    alt={flavor.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Flavor Title & Accent Rule */}
                <div className="mt-5 space-y-2 text-center">
                  <h3 className="font-display text-xl font-bold tracking-tight text-[#3B1A0A]">
                    {flavor.name}
                  </h3>
                  <div
                    aria-hidden="true"
                    className="mx-auto h-0.5 w-10 rounded-full"
                    style={{ backgroundColor: flavor.accentHex }}
                  />
                  {/* Zero-Pill Unboxed Metadata */}
                  <p className="text-sm font-semibold text-[#7A350C] tabular-nums">
                    {formatPhpPrice(flavor.pricePhp)} <span aria-hidden="true">·</span> {flavor.weightGrams} g
                  </p>
                  <p className="text-sm leading-relaxed text-[#4E2813]">
                    {flavor.description}
                  </p>
                </div>
              </div>

              {/* Per-Flavor Order Action */}
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => onSelectFlavor(flavor.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#3B1A0A]/20 bg-[#FFF9F0] px-5 py-2.5 text-sm font-semibold text-[#3B1A0A] transition-colors duration-150 hover:border-[#AF4D10] hover:bg-[#AF4D10] hover:text-[#FFFDF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF4D10] min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Order {flavor.name}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
