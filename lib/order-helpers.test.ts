import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRAND_INFO,
  FLAVOR_SPECS,
  buildOrderMessage,
  clampPackQuantity,
  formatPhpPrice,
  getChannelUrl,
  getFlavorById,
} from './order-helpers';

test('catalog defines all 4 confirmed flavors with standardized Sour Cream naming', () => {
  assert.equal(FLAVOR_SPECS.length, 4);
  const names = FLAVOR_SPECS.map((f) => f.name);
  assert.deepEqual(names, ['BBQ', 'Sour Cream', 'Cheese', 'Ordinary']);
  for (const flavor of FLAVOR_SPECS) {
    assert.equal(flavor.pricePhp, 25);
    assert.equal(flavor.weightGrams, 70);
  }
});

test('Ordinary flavor specifies white pouch matching real product bag', () => {
  const ordinary = getFlavorById('ordinary');
  assert.match(ordinary.pouchColorLabel.toLowerCase(), /white/);
});

test('formatPhpPrice and clampPackQuantity normalize edge values cleanly', () => {
  assert.equal(formatPhpPrice(25), '₱25');
  assert.equal(formatPhpPrice(100), '₱100');
  assert.equal(formatPhpPrice(-5), '₱25');
  assert.equal(clampPackQuantity(0), 1);
  assert.equal(clampPackQuantity(4.6), 5);
  assert.equal(clampPackQuantity(999), 50);
});

test('buildOrderMessage generates flavor, reseller, and general DM messages', () => {
  const singlePack = buildOrderMessage({ kind: 'flavor', flavorId: 'sour-cream', quantity: 1 });
  assert.match(singlePack, /1 pack of Sour Cream \(70g, ₱25 est\.\)/);

  const multiPack = buildOrderMessage({ kind: 'flavor', flavorId: 'bbq', quantity: 4 });
  assert.match(multiPack, /4 packs of BBQ \(70g, ₱100 est\.\)/);

  const reseller = buildOrderMessage({ kind: 'reseller' });
  assert.match(reseller, /reseller/i);
  assert.match(reseller, /bulk pricing/i);

  const general = buildOrderMessage({ kind: 'general' });
  assert.match(general, /70g banana chip packs/);
});

test('social channel URLs exclude tracking params and match verified handles', () => {
  assert.equal(getChannelUrl('instagram-dm'), 'https://ig.me/m/sagingchips.ph');
  assert.equal(getChannelUrl('instagram-profile'), 'https://www.instagram.com/sagingchips.ph/');
  assert.equal(getChannelUrl('messenger'), 'https://m.me/61583254021304');
  assert.equal(BRAND_INFO.location, 'Antipolo City, Philippines');
});
