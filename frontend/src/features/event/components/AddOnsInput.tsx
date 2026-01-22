import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import type { AddOn } from '../../../types/event';
import { DEFAULT_ADDON_TEMPLATES } from '../../../types/event';
import { formatPrice, getUserCurrency } from '../../../utils/currency';

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function AddOnsInput() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addOns = draft.addOns ?? [];

  async function addAddOn(template?: typeof DEFAULT_ADDON_TEMPLATES[0]) {
    const newAddOn: AddOn = {
      id: generateId(),
      name: template?.name || 'New Add-on',
      emoji: template?.emoji || '🎁',
      price: 0,
      quantity: undefined,
      sold: 0,
      description: template?.description || '',
    };
    await updateDraft({ addOns: [...addOns, newAddOn] });
  }

  async function updateAddOn(addOnId: string, updates: Partial<AddOn>) {
    const updated = addOns.map(a => 
      a.id === addOnId ? { ...a, ...updates } : a
    );
    await updateDraft({ addOns: updated });
  }

  async function removeAddOn(addOnId: string) {
    const updated = addOns.filter(a => a.id !== addOnId);
    await updateDraft({ addOns: updated });
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
          <span className="text-xl">🎁</span>
          <div className="text-left">
            <p className="text-white font-medium">Add-ons</p>
            <p className="text-white/50 text-sm">
              {addOns.length > 0 
                ? `${addOns.length} add-on${addOns.length !== 1 ? 's' : ''} available`
                : 'Merchandise, parking, meals...'}
            </p>
          </div>
        </div>
        <span className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          
          {/* Add-ons List */}
          {addOns.length > 0 && (
            <div className="space-y-3">
              {addOns.map((addOn) => (
                <div 
                  key={addOn.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji */}
                    <input
                      type="text"
                      value={addOn.emoji}
                      onChange={(e) => updateAddOn(addOn.id, { emoji: e.target.value.slice(-2) })}
                      className="w-10 h-10 text-xl text-center bg-white/10 rounded-lg border-none outline-none"
                      maxLength={2}
                    />
                    
                    <div className="flex-1 space-y-2">
                      {/* Name & Price */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addOn.name}
                          onChange={(e) => updateAddOn(addOn.id, { name: e.target.value })}
                          placeholder="Add-on name"
                          className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3">
                            <span className="text-white/50 text-sm">$</span>
                            <input
                              type="number"
                              value={addOn.price / 100}
                              onChange={(e) => updateAddOn(addOn.id, { price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                              placeholder="0"
                              className="w-20 py-2 bg-transparent text-white text-sm outline-none"
                              min="0"
                            />
                          </div>
                          {addOn.price > 0 && getUserCurrency().code !== 'USD' && (
                            <span className="text-white/40 text-xs text-right mt-1">
                              ≈ {formatPrice(addOn.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Description */}
                      <input
                        type="text"
                        value={addOn.description || ''}
                        onChange={(e) => updateAddOn(addOn.id, { description: e.target.value })}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 bg-white/5 rounded-lg text-white placeholder-white/30 text-sm outline-none"
                      />
                      
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-xs">Quantity:</span>
                        <input
                          type="number"
                          value={addOn.quantity ?? ''}
                          onChange={(e) => updateAddOn(addOn.id, { quantity: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="Unlimited"
                          className="w-24 px-2 py-1 bg-white/10 rounded text-white text-sm outline-none placeholder-white/30"
                          min="1"
                        />
                        <span className="text-white/40 text-xs">(leave empty for unlimited)</span>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeAddOn(addOn.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => addAddOn()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
            >
              + Add Custom Add-on
            </button>

            {/* Quick Add Templates */}
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ADDON_TEMPLATES.filter(t => 
                !addOns.some(a => a.name === t.name)
              ).map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => addAddOn(template)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-colors"
                >
                  {template.emoji} {template.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
