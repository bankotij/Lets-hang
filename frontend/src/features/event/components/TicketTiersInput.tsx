import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import type { TicketTier } from '../../../types/event';
import { DEFAULT_TIER_TEMPLATES } from '../../../types/event';
import { formatPrice, getUserCurrency } from '../../../utils/currency';

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function TicketTiersInput() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasMultipleTiers = draft.hasMultipleTiers ?? false;
  const tiers = draft.ticketTiers ?? [];

  async function toggleMultipleTiers() {
    if (!hasMultipleTiers) {
      // Enable and add a default tier
      const defaultTier: TicketTier = {
        id: generateId(),
        name: 'General Admission',
        emoji: '🎫',
        color: '#6b7280',
        price: 0,
        quantity: 50,
        sold: 0,
        perks: ['Standard entry'],
        sortOrder: 0,
      };
      await updateDraft({ 
        hasMultipleTiers: true, 
        ticketTiers: [defaultTier] 
      });
    } else {
      await updateDraft({ hasMultipleTiers: false, ticketTiers: [] });
    }
  }

  async function addTier(template?: typeof DEFAULT_TIER_TEMPLATES[0]) {
    const newTier: TicketTier = {
      id: generateId(),
      name: template?.name || 'New Tier',
      emoji: template?.emoji || '🎫',
      color: template?.color || '#8b5cf6',
      price: 0,
      quantity: 50,
      sold: 0,
      perks: template?.perks || [],
      sortOrder: tiers.length,
    };
    await updateDraft({ ticketTiers: [...tiers, newTier] });
  }

  async function updateTier(tierId: string, updates: Partial<TicketTier>) {
    const updated = tiers.map(t => 
      t.id === tierId ? { ...t, ...updates } : t
    );
    await updateDraft({ ticketTiers: updated });
  }

  async function removeTier(tierId: string) {
    const updated = tiers.filter(t => t.id !== tierId);
    await updateDraft({ ticketTiers: updated });
  }

  async function addPerk(tierId: string) {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      await updateTier(tierId, { perks: [...tier.perks, ''] });
    }
  }

  async function updatePerk(tierId: string, perkIndex: number, value: string) {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      const newPerks = [...tier.perks];
      newPerks[perkIndex] = value;
      await updateTier(tierId, { perks: newPerks });
    }
  }

  async function removePerk(tierId: string, perkIndex: number) {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      const newPerks = tier.perks.filter((_, i) => i !== perkIndex);
      await updateTier(tierId, { perks: newPerks });
    }
  }

  return (
    <div className="rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎟️</span>
          <div className="text-left">
            <p className="text-white font-medium">Ticket Tiers</p>
            <p className="text-white/50 text-sm">
              {hasMultipleTiers 
                ? `${tiers.length} tier${tiers.length !== 1 ? 's' : ''} configured`
                : 'Single ticket type'}
            </p>
          </div>
        </div>
        <span className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          {/* Toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white/70 text-sm">Enable multiple ticket tiers</span>
            <button
              type="button"
              onClick={toggleMultipleTiers}
              className={`w-12 h-6 rounded-full transition-colors ${
                hasMultipleTiers ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                hasMultipleTiers ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </label>

          {hasMultipleTiers && (
            <>
              {/* Tiers List */}
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div 
                    key={tier.id}
                    className="rounded-xl border border-white/10 overflow-hidden"
                    style={{ borderLeftColor: tier.color, borderLeftWidth: 4 }}
                  >
                    {/* Tier Header */}
                    <div className="p-4 bg-white/5">
                      <div className="flex items-start gap-3">
                        {/* Emoji picker */}
                        <input
                          type="text"
                          value={tier.emoji}
                          onChange={(e) => updateTier(tier.id, { emoji: e.target.value.slice(-2) })}
                          className="w-10 h-10 text-xl text-center bg-white/10 rounded-lg border-none outline-none"
                          maxLength={2}
                        />
                        
                        <div className="flex-1 space-y-2">
                          {/* Name & Price */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                              placeholder="Tier name"
                              className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3">
                                <span className="text-white/50 text-sm">$</span>
                                <input
                                  type="number"
                                  value={tier.price / 100}
                                  onChange={(e) => updateTier(tier.id, { price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                                  placeholder="0"
                                  className="w-20 py-2 bg-transparent text-white text-sm outline-none"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              {tier.price > 0 && getUserCurrency().code !== 'USD' && (
                                <span className="text-white/40 text-xs text-right mt-1">
                                  ≈ {formatPrice(tier.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Quantity & Color */}
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-white/50 text-xs">Qty:</span>
                              <input
                                type="number"
                                value={tier.quantity}
                                onChange={(e) => updateTier(tier.id, { quantity: parseInt(e.target.value || '0') })}
                                className="w-20 px-2 py-1 bg-white/10 rounded text-white text-sm outline-none"
                                min="1"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/50 text-xs">Color:</span>
                              <input
                                type="color"
                                value={tier.color}
                                onChange={(e) => updateTier(tier.id, { color: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Remove button */}
                        {tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTier(tier.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Perks */}
                    <div className="p-4 border-t border-white/10">
                      <p className="text-white/50 text-xs mb-2">Perks included:</p>
                      <div className="space-y-2">
                        {tier.perks.map((perk, perkIndex) => (
                          <div key={perkIndex} className="flex items-center gap-2">
                            <span className="text-green-400 text-sm">✓</span>
                            <input
                              type="text"
                              value={perk}
                              onChange={(e) => updatePerk(tier.id, perkIndex, e.target.value)}
                              placeholder="Enter perk..."
                              className="flex-1 px-2 py-1 bg-white/5 rounded text-white text-sm placeholder-white/30 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removePerk(tier.id, perkIndex)}
                              className="text-white/30 hover:text-red-400 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addPerk(tier.id)}
                          className="text-purple-400 text-sm hover:text-purple-300"
                        >
                          + Add perk
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Tier Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => addTier()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
                >
                  + Add Custom Tier
                </button>

                {/* Quick Add Templates */}
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TIER_TEMPLATES.filter(t => 
                    !tiers.some(tier => tier.name === t.name)
                  ).slice(0, 4).map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => addTier(template)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {template.emoji} {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
