'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy, ExternalLink, Instagram, MessageCircle, Minus, Plus, X } from 'lucide-react';
import {
  FLAVOR_SPECS,
  buildOrderMessage,
  clampPackQuantity,
  formatPhpPrice,
  getChannelUrl,
  getFlavorById,
  type FlavorId,
  type OrderIntent,
} from '@/lib/order-helpers';

interface OrderHandoffSheetProps {
  isOpen: boolean;
  intent: OrderIntent;
  onChangeIntent: (next: OrderIntent) => void;
  onClose: () => void;
}

export function OrderHandoffSheet({
  isOpen,
  intent,
  onChangeIntent,
  onClose,
}: OrderHandoffSheetProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCopiedMessage(null);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const message = buildOrderMessage(intent);
  const copied = copiedMessage === message;
  const isReseller = intent.kind === 'reseller';
  const activeFlavorId: FlavorId = intent.kind === 'flavor' ? intent.flavorId : 'bbq';
  const activeQuantity = intent.kind === 'flavor' ? intent.quantity : 1;
  const activeFlavor = getFlavorById(activeFlavorId);

  const handleClose = () => {
    setCopiedMessage(null);
    onClose();
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(message);
      }
      setCopiedMessage(message);
    } catch {
      setCopiedMessage(message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#240E05]/65 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-sheet-title"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl bg-[#FFF9F0] p-6 text-[#3B1A0A] shadow-2xl ring-1 ring-[#3B1A0A]/15 sm:rounded-3xl sm:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#3B1A0A]/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#AF4D10]">
                  Direct Message Order
                </p>
                <h2 id="order-sheet-title" className="font-display mt-1 text-2xl font-extrabold text-[#3B1A0A]">
                  {isReseller ? 'Reseller Inquiry' : 'Order Saging Chips'}
                </h2>
              </div>

              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                onClick={handleClose}
                aria-label="Close order sheet"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3B1A0A]/15 text-[#3B1A0A] hover:bg-[#FBEBD6] focus-visible:outline-2 focus-visible:outline-[#AF4D10] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </motion.button>
            </div>

            {/* Mode Switcher: Flavor Order vs Reseller */}
            <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3DFC2] p-1">
              <button
                type="button"
                onClick={() =>
                  onChangeIntent({ kind: 'flavor', flavorId: activeFlavorId, quantity: activeQuantity })
                }
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors min-h-[40px] cursor-pointer ${
                  !isReseller
                    ? 'bg-[#FFF9F0] text-[#3B1A0A] shadow-sm'
                    : 'text-[#5C3118] hover:text-[#3B1A0A]'
                }`}
              >
                Order Packs
              </button>
              <button
                type="button"
                onClick={() => onChangeIntent({ kind: 'reseller' })}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors min-h-[40px] cursor-pointer ${
                  isReseller
                    ? 'bg-[#FFF9F0] text-[#3B1A0A] shadow-sm'
                    : 'text-[#5C3118] hover:text-[#3B1A0A]'
                }`}
              >
                Reseller Inquiry
              </button>
            </div>

            {/* Flavor & Quantity Controls when ordering packs */}
            {!isReseller && (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7A350C]">
                    Choose Flavor
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {FLAVOR_SPECS.map((flavor) => {
                      const selected = intent.kind === 'flavor' && intent.flavorId === flavor.id;
                      return (
                        <motion.button
                          key={flavor.id}
                          type="button"
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                          onClick={() =>
                            onChangeIntent({
                              kind: 'flavor',
                              flavorId: flavor.id,
                              quantity: activeQuantity,
                            })
                          }
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors min-h-[40px] whitespace-nowrap cursor-pointer ${
                            selected
                              ? 'border-[#AF4D10] bg-[#AF4D10] text-[#FFFDF8]'
                              : 'border-[#3B1A0A]/15 bg-[#FBEBD6]/60 text-[#3B1A0A] hover:border-[#AF4D10]'
                          }`}
                        >
                          {flavor.name}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#3B1A0A]/12 bg-[#FBEBD6]/55 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-[#3B1A0A]">
                      {activeFlavor.name} ({activeFlavor.weightGrams}g)
                    </p>
                    <p className="text-xs text-[#6E3A1C] tabular-nums">
                      {formatPhpPrice(activeFlavor.pricePhp)} per pack · Est.{' '}
                      {formatPhpPrice(activeFlavor.pricePhp * activeQuantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                      aria-label="Decrease pack quantity"
                      onClick={() =>
                        onChangeIntent({
                          kind: 'flavor',
                          flavorId: activeFlavorId,
                          quantity: clampPackQuantity(activeQuantity - 1),
                        })
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#3B1A0A]/20 bg-[#FFF9F0] text-[#3B1A0A] hover:bg-[#F3DFC2] cursor-pointer"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </motion.button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">
                      {activeQuantity}
                    </span>
                    <motion.button
                      type="button"
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                      aria-label="Increase pack quantity"
                      onClick={() =>
                        onChangeIntent({
                          kind: 'flavor',
                          flavorId: activeFlavorId,
                          quantity: clampPackQuantity(activeQuantity + 1),
                        })
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#3B1A0A]/20 bg-[#FFF9F0] text-[#3B1A0A] hover:bg-[#F3DFC2] cursor-pointer"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* Copyable DM Message Preview */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A350C]">
                  Ready-to-Send Message
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#AF4D10] hover:bg-[#FBEBD6] focus-visible:outline-2 focus-visible:outline-[#AF4D10] cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy message</span>
                    </>
                  )}
                </button>
              </div>
              <p className="rounded-xl border border-[#3B1A0A]/12 bg-[#FBEBD6]/45 p-3.5 text-sm leading-relaxed text-[#3B1A0A]">
                {message}
              </p>
            </div>

            {/* Direct Social Channel Buttons */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <motion.a
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                href={getChannelUrl('instagram-dm')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#AF4D10] px-5 py-3 text-sm font-semibold text-[#FFFDF8] shadow-sm transition-colors hover:bg-[#8E3C0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF4D10] min-h-[44px] whitespace-nowrap"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                <span>Open Instagram DM</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </motion.a>

              <motion.a
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                href={getChannelUrl('messenger')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3B1A0A]/20 bg-[#FFF9F0] px-5 py-3 text-sm font-semibold text-[#3B1A0A] transition-colors hover:border-[#AF4D10] hover:bg-[#FBEBD6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF4D10] min-h-[44px] whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Open Messenger</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
