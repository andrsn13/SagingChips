'use client';

import { useState } from 'react';
import type { FlavorId, OrderIntent } from '@/lib/order-helpers';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { WaveCreamToDarkCocoa, WaveOrangeToCream } from './WavyDivider';
import { FlavorsSection } from './FlavorsSection';
import { WhySagingSection } from './WhySagingSection';
import { PerfectForSection } from './PerfectForSection';
import { PackAndResellerSection } from './PackAndResellerSection';
import { Footer } from './Footer';
import { OrderHandoffSheet } from './OrderHandoffSheet';
import { MobileOrderBar } from './MobileOrderBar';

export function LandingPageClient() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [intent, setIntent] = useState<OrderIntent>({
    kind: 'flavor',
    flavorId: 'bbq',
    quantity: 1,
  });

  const openFlavorOrder = (flavorId: FlavorId) => {
    setIntent({ kind: 'flavor', flavorId, quantity: 1 });
    setSheetOpen(true);
  };

  const openGeneralOrder = () => {
    setIntent({ kind: 'flavor', flavorId: 'bbq', quantity: 2 });
    setSheetOpen(true);
  };

  const openResellerInquiry = () => {
    setIntent({ kind: 'reseller' });
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FBEBD6] text-[#3B1A0A]">
      <Navbar onOrderClick={openGeneralOrder} />

      <main>
        <HeroSection onOrderClick={openGeneralOrder} />
        <WaveOrangeToCream />
        <FlavorsSection onSelectFlavor={openFlavorOrder} />
        <WhySagingSection />
        <PerfectForSection />
        <PackAndResellerSection onResellerClick={openResellerInquiry} />
        <WaveCreamToDarkCocoa />
      </main>

      <Footer onOrderClick={openGeneralOrder} />

      <MobileOrderBar onOrderClick={openGeneralOrder} />

      <OrderHandoffSheet
        isOpen={sheetOpen}
        intent={intent}
        onChangeIntent={setIntent}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
