import { useEventDraft } from '../../../state/eventState';
import { FlyerUploader } from './FlyerUploader';
import { BackgroundUploader } from './BackgroundUploader';

const TEXT_SHADOW_STYLE: React.CSSProperties = {
  textShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export function EventPreviewCard() {
  const { flyerUrl } = useEventDraft();

  return (
    <>
      {/* Flyer Card */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm">
        {flyerUrl ? (
          /* Full-bleed flyer image */
          <img
            src={flyerUrl}
            alt="Event flyer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Placeholder text */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center select-none">
              <p
                className="text-[4.5rem] font-black text-white leading-[0.85] tracking-[-0.02em] drop-shadow-lg"
                style={TEXT_SHADOW_STYLE}
              >
                YOU'RE
              </p>
              <p
                className="text-[5.5rem] font-black text-white leading-[0.85] tracking-[-0.02em] drop-shadow-lg"
                style={TEXT_SHADOW_STYLE}
              >
                INVITED
              </p>
            </div>
          </div>
        )}

        {/* Upload flyer button - bottom right */}
        <div className="absolute bottom-4 right-4 z-20">
          <FlyerUploader compact />
        </div>
      </div>

      {/* Change Background Bar */}
      <BackgroundUploader variant="bar" />
    </>
  );
}
