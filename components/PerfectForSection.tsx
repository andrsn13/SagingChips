import Image from 'next/image';
import { Briefcase, Car, GraduationCap } from 'lucide-react';
import { OCCASION_POLAROIDS } from '@/lib/catalog';

const OCCASIONS = [
  { label: 'School', Icon: GraduationCap },
  { label: 'Work', Icon: Briefcase },
  { label: 'Road Trips', Icon: Car },
] as const;

export function PerfectForSection() {
  return (
    <section
      id="perfect-for"
      className="relative overflow-hidden bg-gradient-to-b from-[#FBEBD6] via-[#FBEBD6] to-[#F5E1C5] py-16 sm:py-20 lg:py-24"
    >
      {/* Warm burnt-orange organic wave backdrop strictly behind the right polaroid showcase on desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[48%] bg-[#C85A14] rounded-t-[56px] lg:left-[45%] lg:top-10 lg:rounded-tl-[120px] lg:rounded-tr-none"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        {/* Left column: Occasion Copy & Icons */}
        <div className="lg:col-span-5 space-y-6 rounded-3xl bg-[#FBEBD6] p-6 sm:p-8 lg:bg-transparent lg:p-0 lg:pr-4">
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#AF4D10]">
              Perfect For
            </p>
            <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight text-[#3B1A0A] sm:text-4xl">
              Any Day, Any Adventure
            </h2>
            <p className="text-base leading-relaxed text-[#4E2813]">
              Whether you&apos;re studying, working, or on the go — Saging Chips is your easy, crunchy snack companion.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-[#3B1A0A]/12 pt-5">
            {OCCASIONS.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-start gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3B1A0A]/15 bg-[#FFF9F0] text-[#3B1A0A]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-[#3B1A0A] whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: 3 Polaroid Lifestyle Cards */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
            {OCCASION_POLAROIDS.map((item) => (
              <figure
                key={item.id}
                className={`rounded-lg bg-[#FFFDF9] p-2.5 pb-4 shadow-xl ring-1 ring-black/10 transition-transform duration-200 hover:rotate-0 hover:-translate-y-1 ${item.tiltClass}`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-[#E8D5BE]">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <figcaption className="mt-3 text-center font-display text-sm font-bold text-[#3B1A0A]">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
