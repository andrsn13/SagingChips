export type FlavorId = 'bbq' | 'sour-cream' | 'cheese' | 'ordinary';

export type OrderIntent =
  | { kind: 'general' }
  | { kind: 'flavor'; flavorId: FlavorId; quantity: number }
  | { kind: 'reseller' };

export type SocialChannelId = 'instagram-profile' | 'instagram-dm' | 'facebook-profile' | 'messenger';

export interface FlavorSpec {
  id: FlavorId;
  name: string;
  pouchColorLabel: string;
  accentHex: string;
  pricePhp: number;
  weightGrams: number;
  description: string;
}

export const BRAND_INFO = {
  brandName: 'Saging Chips',
  wordmark: 'Saging',
  subhead: 'BANANA CHIPS',
  tagline: 'Small Pack. Big Happiness.',
  location: 'Antipolo City, Philippines',
  maker: 'Gian Geverola',
  defaultPricePhp: 25,
  packWeightGrams: 70,
  packDimensions: '12×20 cm stand-up zip pouch',
  shelfLifeSealed: '2–4 months sealed',
  shelfLifeOpened: '1–2 weeks opened (resealed)',
} as const;

export const SOCIAL_CHANNELS: Record<SocialChannelId, { label: string; url: string }> = {
  'instagram-profile': {
    label: 'Instagram',
    url: 'https://www.instagram.com/sagingchips.ph/',
  },
  'instagram-dm': {
    label: 'Order on Instagram',
    url: 'https://ig.me/m/sagingchips.ph',
  },
  'facebook-profile': {
    label: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61583254021304',
  },
  messenger: {
    label: 'Message on Messenger',
    url: 'https://m.me/61583254021304',
  },
};

export const FLAVOR_SPECS: readonly FlavorSpec[] = [
  {
    id: 'bbq',
    name: 'BBQ',
    pouchColorLabel: 'Red metallic pouch',
    accentHex: '#B91C1C',
    pricePhp: 25,
    weightGrams: 70,
    description: 'Smoky, sweet, and savory, inspired by classic barbecue seasoning.',
  },
  {
    id: 'sour-cream',
    name: 'Sour Cream',
    pouchColorLabel: 'Green metallic pouch',
    accentHex: '#15803D',
    pricePhp: 25,
    weightGrams: 70,
    description: 'Tangy, creamy, and savory — a cool twist on the classic crunch.',
  },
  {
    id: 'cheese',
    name: 'Cheese',
    pouchColorLabel: 'Gold metallic pouch',
    accentHex: '#B45309',
    pricePhp: 25,
    weightGrams: 70,
    description: 'Rich, creamy, and cheesy; makes every crispy bite more flavorful.',
  },
  {
    id: 'ordinary',
    name: 'Ordinary',
    pouchColorLabel: 'White matte pouch',
    accentHex: '#78350F',
    pricePhp: 25,
    weightGrams: 70,
    description: 'The classic taste of crispy banana chips for a simple, natural snack.',
  },
] as const;

export function getFlavorById(id: FlavorId): FlavorSpec {
  const found = FLAVOR_SPECS.find((flavor) => flavor.id === id);
  if (!found) {
    return FLAVOR_SPECS[0];
  }
  return found;
}

export function formatPhpPrice(amountPhp: number): string {
  const normalized = Number.isFinite(amountPhp) && amountPhp > 0 ? Math.round(amountPhp) : 25;
  return `₱${normalized}`;
}

export function clampPackQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(50, Math.round(quantity)));
}

export function buildOrderMessage(intent: OrderIntent): string {
  if (intent.kind === 'reseller') {
    return 'Hi Saging Chips! I am interested in becoming a reseller. Could you share your bulk pricing and minimum order details?';
  }

  if (intent.kind === 'flavor') {
    const flavor = getFlavorById(intent.flavorId);
    const qty = clampPackQuantity(intent.quantity);
    const total = formatPhpPrice(flavor.pricePhp * qty);
    const packLabel = qty === 1 ? 'pack' : 'packs';
    return `Hi Saging Chips! I'd like to order ${qty} ${packLabel} of ${flavor.name} (${flavor.weightGrams}g, ${total} est.). Are stocks available?`;
  }

  return "Hi Saging Chips! I'd like to order some 70g banana chip packs. What flavors are available right now?";
}

export function getChannelUrl(channelId: SocialChannelId): string {
  return SOCIAL_CHANNELS[channelId].url;
}
