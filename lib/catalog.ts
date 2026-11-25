import type { StaticImageData } from 'next/image';
import heroCrunchBowl from '@/src/assets/images/hero_crunch_bowl_1795607517283.jpg';
import pouchBbq from '@/src/assets/images/pouch_bbq_1795607518650.jpg';
import pouchSourCream from '@/src/assets/images/pouch_sour_cream_1795607518849.jpg';
import pouchCheese from '@/src/assets/images/pouch_cheese_1795607518941.jpg';
import pouchOrdinary from '@/src/assets/images/pouch_ordinary_1795607520125.jpg';
import whySagingMacro from '@/src/assets/images/why_saging_macro_1795607516817.jpg';
import occasionStudyDesk from '@/src/assets/images/occasion_study_desk_1795607518684.jpg';
import occasionRoadTrip from '@/src/assets/images/occasion_road_trip_1795607518449.jpg';
import occasionFriendsSharing from '@/src/assets/images/occasion_friends_sharing_1795607519140.jpg';
import { FLAVOR_SPECS, type FlavorId, type FlavorSpec } from './order-helpers';

export interface FlavorItem extends FlavorSpec {
  image: StaticImageData;
  alt: string;
}

const FLAVOR_IMAGE_MAP: Record<FlavorId, { image: StaticImageData; alt: string }> = {
  bbq: {
    image: pouchBbq,
    alt: 'Saging Banana Chips BBQ 70g red metallic stand-up zip pouch with clear chip window',
  },
  'sour-cream': {
    image: pouchSourCream,
    alt: 'Saging Banana Chips Sour Cream 70g green metallic stand-up zip pouch with clear chip window',
  },
  cheese: {
    image: pouchCheese,
    alt: 'Saging Banana Chips Cheese 70g gold metallic stand-up zip pouch with clear chip window',
  },
  ordinary: {
    image: pouchOrdinary,
    alt: 'Saging Banana Chips Ordinary 70g white matte stand-up zip pouch with clear chip window',
  },
};

export const FLAVORS: readonly FlavorItem[] = FLAVOR_SPECS.map((spec) => ({
  ...spec,
  ...FLAVOR_IMAGE_MAP[spec.id],
}));

export const HERO_MEDIA = {
  image: heroCrunchBowl,
  alt: 'Saging Banana Chips pouch pouring crispy golden banana chips into a dark bowl',
};

export const WHY_SAGING_MEDIA = {
  image: whySagingMacro,
  alt: 'Close-up macro view of crispy caramelized golden banana chip slices',
};

export const OCCASION_POLAROIDS = [
  {
    id: 'study',
    caption: 'Study & Desk Fuel',
    tiltClass: 'md:-rotate-3',
    image: occasionStudyDesk,
    alt: 'Red Saging Banana Chips BBQ pouch on a sunlit wooden study desk beside a notebook and laptop',
  },
  {
    id: 'road-trip',
    caption: 'Road Trips & Views',
    tiltClass: 'md:rotate-1 md:-translate-y-3',
    image: occasionRoadTrip,
    alt: 'Hand holding a gold Saging Banana Chips Cheese pouch by a car window overlooking lush green hills',
  },
  {
    id: 'friends',
    caption: 'Barkada Sharing',
    tiltClass: 'md:rotate-3',
    image: occasionFriendsSharing,
    alt: 'Friends gathered outdoors sharing a wooden bowl of crispy golden banana chips',
  },
] as const;
