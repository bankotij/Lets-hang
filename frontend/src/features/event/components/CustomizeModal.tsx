import { useEventDraft, useEventDraftActions } from '../../../state/eventState';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const themeOptions = [
  { id: 'purple', label: 'Purple Dream', gradient: 'linear-gradient(145deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)' },
  { id: 'pink', label: 'Pink Sunset', gradient: 'linear-gradient(145deg, #ec4899 0%, #f472b6 50%, #fda4af 100%)' },
  { id: 'blue', label: 'Ocean Blue', gradient: 'linear-gradient(145deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)' },
  { id: 'green', label: 'Forest Green', gradient: 'linear-gradient(145deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)' },
  { id: 'orange', label: 'Warm Orange', gradient: 'linear-gradient(145deg, #f97316 0%, #fb923c 50%, #fdba74 100%)' },
  { id: 'dark', label: 'Dark Mode', gradient: 'linear-gradient(145deg, #1f2937 0%, #374151 50%, #4b5563 100%)' },
];

export function CustomizeModal({ isOpen, onClose }: Props) {
  const { backgroundUrl } = useEventDraft();
  const { updateDraft } = useEventDraftActions();

  if (!isOpen) return null;

  async function handleThemeSelect(gradient: string) {
    await updateDraft({ backgroundUrl: gradient });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Customize Event</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Theme Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Background Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((theme) => {
              const isSelected = backgroundUrl === theme.gradient;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeSelect(theme.gradient)}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-white ring-2 ring-white/50' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div
                    className="w-full h-12 rounded-lg mb-2"
                    style={{ background: theme.gradient }}
                  />
                  <span className="text-xs text-white/70">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RSVP Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">RSVP Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-pink-500" defaultChecked />
              <span className="text-sm text-white/80">Allow RSVPs</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-pink-500" />
              <span className="text-sm text-white/80">Require approval</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-pink-500" />
              <span className="text-sm text-white/80">Send reminders</span>
            </label>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

