import Image from 'next/image';
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
  return (
    <section id="why-saging" className="bg-[#FBEBD6] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-stretch gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        {/* Left: Macro Crunch Visual */}
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/3] h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#240E05] shadow-xl">
            <Image
              src={WHY_SAGING_MEDIA.image}
              alt={WHY_SAGING_MEDIA.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right: Story & 3 Pillars */}
        <div className="flex flex-col justify-center space-y-6 lg:col-span-6">
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#AF4D10]">
              Why Saging?
            </p>
            <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-4xl">
              More Than Just a Snack
            </h2>
            <p className="text-base leading-relaxed text-[#4E2813]">
              Saging Chips brings you the perfect crunch made from real bananas. A snack that&apos;s simple, delicious, and always satisfying.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-[#3B1A0A]/12 pt-6 sm:grid-cols-3">
            {PILLARS.map(({ title, description, Icon }) => (
              <div key={title} className="space-y-2.5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3B1A0A]/15 bg-[#FFF9F0] text-[#AF4D10]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-bold text-[#3B1A0A]">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#5C3118]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
