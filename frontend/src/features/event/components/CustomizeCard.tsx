import './CustomizeCard.css';

type Props = {
  onCustomize?: () => void;
};

export function CustomizeCard({ onCustomize }: Props) {
  return (
    <div className="customize-card-wrapper">
      {/* Rotating border */}
      <div className="customize-card-border" />
      
      {/* Glass card content */}
      <div className="customize-card-content relative">
        {/* Floating icons - scattered positioning */}
        
        {/* Megaphone - top left */}
        <div className="absolute top-4 left-6 text-white/60 -rotate-12">
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4z"/>
          </svg>
        </div>

        {/* Dice - top left-center */}
        <div className="absolute top-3 left-24 text-white/60 rotate-6">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/>
          </svg>
        </div>

        {/* Flower/Party - bottom left */}
        <div className="absolute bottom-20 left-8 text-white/60 rotate-12">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z"/>
          </svg>
        </div>

        {/* Link icon - top right */}
        <div className="absolute top-4 right-20 text-white/60">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>

        {/* Image frame - top right corner */}
        <div className="absolute top-3 right-5 text-white/60 rotate-6">
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>

        {/* RSVP text - bottom right */}
        <div className="absolute bottom-20 right-6 text-white/60 font-bold text-base italic tracking-wide">
          RSVP
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-14">
          <div className="text-center">
            <p className="text-white font-medium text-base">Customize your</p>
            <p className="text-white font-medium text-base">event your way</p>
          </div>
        </div>

        {/* Button - at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            type="button"
            onClick={onCustomize}
            className="w-full py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/40 text-white font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
          >
            <span>🎨</span>
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
}
