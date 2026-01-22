import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInitEventDraft, useEventDraft } from '../../state/eventState';
import { HeaderUserMenu } from '../../components/HeaderUserMenu';
import { EventPreviewCard } from './components/EventPreviewCard';
import { EventNameField } from './components/EventNameField';
import { EventDetailsCard } from './components/EventDetailsCard';
import { DescriptionField } from './components/DescriptionField';
import { QuickLinkPills } from './components/QuickLinkPills';
import { CategorySelector } from './components/CategorySelector';
import { TagsInput } from './components/TagsInput';
import { TicketTiersInput } from './components/TicketTiersInput';
import { PrivacySettings } from './components/PrivacySettings';
import { AddOnsInput } from './components/AddOnsInput';
import { CustomQuestionsInput } from './components/CustomQuestionsInput';
import { CustomizeCard } from './components/CustomizeCard';
import { CustomizeModal } from './components/CustomizeModal';
import { GoLiveButton } from './components/GoLiveButton';

const DEFAULT_GRADIENT =
  'linear-gradient(145deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)';

export function CreateEventPage() {
  useInitEventDraft();
  const { backgroundUrl } = useEventDraft();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const pageStyle = useMemo<React.CSSProperties>(() => {
    const bgValue = backgroundUrl || DEFAULT_GRADIENT;
    const isGradient = bgValue.startsWith('linear-gradient');
    return {
      backgroundImage: isGradient ? bgValue : `url(${bgValue})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    };
  }, [backgroundUrl]);

  return (
    <div className="min-h-screen relative" style={pageStyle}>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link to="/search" className="text-2xl font-bold text-white italic tracking-tight hover:text-purple-300 transition-colors">
              let's hang
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link to="/search" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                Discover
              </Link>
              <Link to="/profile" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                Profile
              </Link>
              <Link to="/create" className="text-purple-400 text-sm font-medium">
                Create Event
              </Link>
            </nav>
          </div>

          <HeaderUserMenu />
        </header>

        {/* Main Content */}
        <main className="px-8 py-4 max-w-6xl mx-auto pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12 items-start">
            {/* Left Column - Preview */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-8">
              <EventPreviewCard />
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col gap-3">
              {/* Basic Info */}
              <EventNameField />
              <EventDetailsCard />
              <DescriptionField />

              {/* Categorization */}
              <CategorySelector />
              <TagsInput />

              {/* Ticket Configuration */}
              <div className="mt-4">
                <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2 px-1">
                  Ticketing
                </h3>
                <div className="space-y-3">
                  <TicketTiersInput />
                  <AddOnsInput />
                </div>
              </div>

              {/* Privacy & Access */}
              <div className="mt-4">
                <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2 px-1">
                  Access Control
                </h3>
                <div className="space-y-3">
                  <PrivacySettings />
                  <CustomQuestionsInput />
                </div>
              </div>

              {/* Customization */}
              <div className="mt-4">
                <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2 px-1">
                  Extras
                </h3>
                <div className="space-y-3">
                  <QuickLinkPills />
                  <CustomizeCard onCustomize={() => setShowCustomizeModal(true)} />
                </div>
              </div>

              {/* Publish */}
              <div className="mt-6">
                <GoLiveButton />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Customize Modal */}
      <CustomizeModal 
        isOpen={showCustomizeModal} 
        onClose={() => setShowCustomizeModal(false)} 
      />
    </div>
  );
}
