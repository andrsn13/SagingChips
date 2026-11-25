'use client';

import { ArrowRight, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { BRAND_INFO, getChannelUrl } from '@/lib/order-helpers';

interface FooterProps {
  onOrderClick: () => void;
}

export function Footer({ onOrderClick }: FooterProps) {
  return (
    <footer id="about" className="bg-[#3B1A0A] pb-24 pt-12 text-[#FFF9F0] md:pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 border-b border-[#FFF9F0]/15 pb-10 lg:flex-row lg:items-center">
          {/* Brand Lockup + Tagline + Maker Credit */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <span className="font-display text-3xl font-extrabold tracking-tight text-[#FFFDF8]">
                  {BRAND_INFO.wordmark}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#F6C21C]">
                  {BRAND_INFO.subhead}
                </span>
              </div>

              <span aria-hidden="true" className="hidden h-9 w-px bg-[#FFF9F0]/25 sm:inline-block" />

              <p className="font-display text-lg font-bold text-[#FBEBD6]">
                {BRAND_INFO.tagline}
              </p>
            </div>

            <p className="text-sm text-[#E5C9A8]">
              Made by {BRAND_INFO.maker} in {BRAND_INFO.location}
            </p>
          </div>

          {/* Primary CTA + Verified Social Channels */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOrderClick}
              className="inline-flex items-center gap-2 rounded-full border border-[#FFF9F0]/35 bg-[#4D2410] px-5 py-2.5 text-sm font-semibold text-[#FFFDF8] transition-colors duration-150 hover:border-[#F6C21C] hover:bg-[#F6C21C] hover:text-[#3B1A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C21C] min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" />
              <span>Order on Instagram</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              <a
                href={getChannelUrl('instagram-profile')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Saging Chips on Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#FFF9F0]/20 text-[#FBEBD6] transition-colors hover:border-[#F6C21C] hover:text-[#F6C21C] focus-visible:outline-2 focus-visible:outline-[#F6C21C]"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={getChannelUrl('facebook-profile')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Saging Chips on Facebook"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#FFF9F0]/20 text-[#FBEBD6] transition-colors hover:border-[#F6C21C] hover:text-[#F6C21C] focus-visible:outline-2 focus-visible:outline-[#F6C21C]"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={getChannelUrl('messenger')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message Saging Chips on Facebook Messenger"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#FFF9F0]/20 text-[#FBEBD6] transition-colors hover:border-[#F6C21C] hover:text-[#F6C21C] focus-visible:outline-2 focus-visible:outline-[#F6C21C]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="mt-6 flex flex-col justify-between gap-2 text-xs text-[#D6B48F] sm:flex-row sm:items-center">
          <p>© 2026 {BRAND_INFO.brandName}. All rights reserved.</p>
          <p>{BRAND_INFO.location}</p>
        </div>
      </div>
    </footer>
  );
}
