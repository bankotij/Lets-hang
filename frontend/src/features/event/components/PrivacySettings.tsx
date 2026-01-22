import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import type { PrivacyType } from '../../../types/event';
import { formatPrice, getUserCurrency } from '../../../utils/currency';

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const PRIVACY_OPTIONS: { value: PrivacyType; label: string; icon: string; description: string }[] = [
  { value: 'public', label: 'Public', icon: '🌍', description: 'Anyone can see and join' },
  { value: 'private', label: 'Approval Required', icon: '🔒', description: 'Requests need host approval' },
  { value: 'invite-only', label: 'Invite Only', icon: '✉️', description: 'Only invited guests can join' },
  { value: 'password', label: 'Password Protected', icon: '🔑', description: 'Requires password to view' },
];

export function PrivacySettings() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  const privacyType = draft.privacyType || 'public';
  const currentOption = PRIVACY_OPTIONS.find(o => o.value === privacyType);

  async function setPrivacyType(type: PrivacyType) {
    const updates: Partial<typeof draft> = { 
      privacyType: type,
      isPrivate: type !== 'public',
    };
    
    // Generate invite code for invite-only events
    if (type === 'invite-only' && !draft.inviteCode) {
      updates.inviteCode = generateInviteCode();
    }
    
    await updateDraft(updates);
  }

  async function regenerateInviteCode() {
    await updateDraft({ inviteCode: generateInviteCode() });
  }

  async function setEventPassword(password: string) {
    await updateDraft({ eventPassword: password });
  }

  // Plus-one settings
  async function togglePlusOnes() {
    await updateDraft({ allowPlusOnes: !draft.allowPlusOnes });
  }

  async function setMaxPlusOnes(max: number) {
    await updateDraft({ maxPlusOnes: max });
  }

  async function setPlusOneCost(cost: number) {
    await updateDraft({ plusOneCost: cost });
  }

  // Group registration
  async function toggleGroupRegistration() {
    await updateDraft({ allowGroupRegistration: !draft.allowGroupRegistration });
  }

  async function setGroupSettings(settings: { minGroupSize?: number; maxGroupSize?: number; groupDiscount?: number }) {
    await updateDraft(settings);
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
          <span className="text-xl">{currentOption?.icon || '🌍'}</span>
          <div className="text-left">
            <p className="text-white font-medium">Privacy & Access</p>
            <p className="text-white/50 text-sm">{currentOption?.label || 'Public'}</p>
          </div>
        </div>
        <span className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/10 pt-4">
          
          {/* Privacy Type Selection */}
          <div className="space-y-2">
            <p className="text-white/70 text-sm font-medium">Event Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              {PRIVACY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPrivacyType(option.value)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    privacyType === option.value
                      ? 'bg-purple-500/20 border-purple-500/50 border'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{option.icon}</span>
                    <span className={`text-sm font-medium ${
                      privacyType === option.value ? 'text-purple-400' : 'text-white'
                    }`}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Invite Code (for invite-only) */}
          {privacyType === 'invite-only' && (
            <div className="space-y-3 p-4 bg-white/5 rounded-xl">
              <p className="text-white/70 text-sm font-medium">Invite Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-black/30 rounded-lg text-purple-400 font-mono text-lg tracking-widest text-center">
                  {draft.inviteCode || generateInviteCode()}
                </code>
                <button
                  type="button"
                  onClick={regenerateInviteCode}
                  className="p-3 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition-colors"
                  title="Generate new code"
                >
                  🔄
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(draft.inviteCode || '')}
                  className="p-3 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition-colors"
                  title="Copy code"
                >
                  📋
                </button>
              </div>
              <p className="text-white/40 text-xs">
                Share this code with guests. They'll need it to access the event.
              </p>
            </div>
          )}

          {/* Password (for password protected) */}
          {privacyType === 'password' && (
            <div className="space-y-3 p-4 bg-white/5 rounded-xl">
              <p className="text-white/70 text-sm font-medium">Event Password</p>
              <input
                type="text"
                value={draft.eventPassword || ''}
                onChange={(e) => setEventPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-black/30 rounded-lg text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="text-white/40 text-xs">
                Guests will need to enter this password to view event details.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Plus-Ones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Allow Plus-Ones</p>
                <p className="text-white/50 text-xs">Guests can bring additional people</p>
              </div>
              <button
                type="button"
                onClick={togglePlusOnes}
                className={`w-12 h-6 rounded-full transition-colors ${
                  draft.allowPlusOnes ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  draft.allowPlusOnes ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {draft.allowPlusOnes && (
              <div className="grid grid-cols-2 gap-3 pl-4">
                <div>
                  <p className="text-white/50 text-xs mb-1">Max plus-ones per guest</p>
                  <input
                    type="number"
                    value={draft.maxPlusOnes ?? 1}
                    onChange={(e) => setMaxPlusOnes(parseInt(e.target.value) || 1)}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Cost per plus-one ($)</p>
                  <input
                    type="number"
                    value={(draft.plusOneCost ?? 0) / 100}
                    onChange={(e) => setPlusOneCost(Math.round(parseFloat(e.target.value || '0') * 100))}
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm outline-none"
                  />
                  {(draft.plusOneCost || 0) > 0 && getUserCurrency().code !== 'USD' && (
                    <span className="text-white/40 text-xs block mt-1">
                      ≈ {formatPrice(draft.plusOneCost || 0)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Group Registration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Group Registration</p>
                <p className="text-white/50 text-xs">Allow teams/groups to register together</p>
              </div>
              <button
                type="button"
                onClick={toggleGroupRegistration}
                className={`w-12 h-6 rounded-full transition-colors ${
                  draft.allowGroupRegistration ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  draft.allowGroupRegistration ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {draft.allowGroupRegistration && (
              <div className="grid grid-cols-3 gap-3 pl-4">
                <div>
                  <p className="text-white/50 text-xs mb-1">Min size</p>
                  <input
                    type="number"
                    value={draft.minGroupSize ?? 2}
                    onChange={(e) => setGroupSettings({ minGroupSize: parseInt(e.target.value) || 2 })}
                    min="2"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Max size</p>
                  <input
                    type="number"
                    value={draft.maxGroupSize ?? 10}
                    onChange={(e) => setGroupSettings({ maxGroupSize: parseInt(e.target.value) || 10 })}
                    min="2"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Discount %</p>
                  <input
                    type="number"
                    value={draft.groupDiscount ?? 0}
                    onChange={(e) => setGroupSettings({ groupDiscount: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm outline-none"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
