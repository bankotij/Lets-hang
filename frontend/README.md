# Let's Hang - Event Creation Page

A React + TypeScript implementation of an event creation flow with a mock backend architecture designed for easy transition to a real backend.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 📁 Project Structure

```
src/
├── api/                    # Backend abstraction layer
│   ├── client.ts           # Mock API client (swap to real fetch here)
│   └── eventApi.ts         # Event-specific API functions
├── state/                  # State management (Jotai)
│   └── eventState.ts       # Event draft atom + hooks
├── types/                  # TypeScript type definitions
│   └── event.ts            # EventDraft, QuickLink, GalleryImage types
├── features/event/         # Event feature module
│   ├── CreateEventPage.tsx # Main page component
│   └── components/         # UI components
│       ├── EventPreviewCard.tsx   # Flyer preview card
│       ├── FlyerUploader.tsx      # Flyer image upload
│       ├── BackgroundUploader.tsx # Background image upload
│       ├── EventNameField.tsx     # Editable event name
│       ├── EventDetailsCard.tsx   # Date, location, cost fields
│       ├── DescriptionField.tsx   # Event description textarea
│       ├── PhoneInput.tsx         # Phone number with save button
│       ├── QuickLinkPills.tsx     # Toggleable module pills
│       ├── CapacityInput.tsx      # Capacity input (quick-link module)
│       ├── LinksInput.tsx         # Multiple links input (quick-link module)
│       ├── GalleryInput.tsx       # Photo gallery upload (quick-link module)
│       ├── CustomizeCard.tsx      # Customize CTA with animated border
│       ├── CustomizeModal.tsx     # Theme & RSVP settings modal
│       └── GoLiveButton.tsx       # Publish event button
└── utils/                  # Utility functions
    └── file.ts             # File reading utilities (dataURL conversion)
```

## ✨ Features Implemented

### Core Event Creation
- ✅ **Event Name** — Click to edit, saves on blur
- ✅ **Phone Number** — With arrow button to save
- ✅ **Date & Time** — DateTime picker input
- ✅ **Location** — Text input for venue/address
- ✅ **Cost per Person** — Text input for pricing
- ✅ **Description** — Textarea for event details

### Image Uploads
- ✅ **Flyer Image** — Upload/change event flyer with live preview
- ✅ **Background Image** — Changes the entire page background
- ✅ **Photo Gallery** — Upload multiple event photos (quick-link module)

### Quick-Link Modules (Backend-Defined)
Toggleable modules that expand when clicked:
- ✅ **Capacity** — Set max attendees
- ✅ **Links** — Add multiple URLs with remove functionality
- ✅ **Photo Gallery** — Upload and manage multiple photos in a grid
- ✅ **Privacy** — Placeholder for privacy settings

### Customize Modal
- ✅ **Theme Selection** — 6 preset background gradients:
  - Purple Dream, Pink Sunset, Ocean Blue
  - Forest Green, Warm Orange, Dark Mode
- ✅ **RSVP Settings** — Toggle checkboxes for:
  - Allow RSVPs
  - Require approval
  - Send reminders

### Go Live Button
- ✅ **Validation** — Checks for event name before publishing
- ✅ **Publishing State** — Shows loading spinner
- ✅ **Success State** — Changes to "Event is Live!" confirmation

### UI/UX Details
- ✅ Loading/saving states on all form fields
- ✅ Inline error handling
- ✅ Glass-like card styling with subtle blur effects
- ✅ Animated rotating border on Customize card
- ✅ Responsive two-column layout
- ✅ Header with navigation and Sign In button

## 🏗️ Architecture Decisions

### Mock Backend with Easy Swap Path

The backend is abstracted through `src/api/client.ts`:

```typescript
// Current: Mock implementation with simulated delay
export async function mockCall<T>(fn: () => T): Promise<ApiResult<T>> {
  await sleep(250);
  return { ok: true, data: fn() };
}

// To swap to real backend, replace with:
// export async function apiCall<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
//   const response = await fetch(url, options);
//   return response.json();
// }
```

Each API function in `eventApi.ts` uses this client, requiring **only 1-2 line changes** to connect to a real backend.

### State Management

Using **Jotai** for state management (similar API to Recoil, but React 19 compatible):

- State updates ONLY happen via successful backend calls
- No direct atom setters exposed
- All mutations go through `useEventDraftActions().updateDraft()`

```typescript
// State is only updated after backend success
async function updateDraft(patch: Partial<EventDraft>) {
  const result = await eventApi.saveDraft(patch);
  if (result.ok) {
    setDraft(result.data);
  }
  return result;
}
```

### Quick-Link Modules (Backend-Defined)

Customizable modules are defined by backend data:

```typescript
// Backend defines available modules
const defaultQuickLinks = [
  { id: 'capacity', label: 'Capacity', enabled: false },
  { id: 'gallery', label: 'Photo gallery', enabled: false },
  { id: 'links', label: 'Links', enabled: false },
  { id: 'privacy', label: 'Privacy', enabled: false },
];
```

Frontend renders based on this data, allowing **new modules to be added without frontend changes**.

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tooling |
| **Jotai** | State management |
| **Tailwind CSS** | Styling |
| **React Router** | Navigation |

## 📝 Design Decisions

1. **Data URLs for Images**: Using FileReader to convert uploads to data URLs for in-memory persistence. In production, these would upload to a CDN and store URLs.

2. **Blur on Save**: Form fields save on blur rather than on every keystroke to reduce API calls and match common UX patterns.

3. **Minimal Glassmorphism**: Kept glass effects subtle (backdrop-blur, transparency) as instructed, focusing on functionality first.

4. **Feature-Based Structure**: Components organized by feature (`/features/event/`) for scalability.

5. **Backend-Driven Modules**: Quick-links are defined in the mock backend, demonstrating how the frontend can dynamically render modules based on backend configuration.

## 🎥 Demo Flow

The app demonstrates:

1. **Create Event** — Enter name, phone, date, location, cost, description
2. **Upload Flyer** — Click upload button on preview card
3. **Change Background** — Click "Change background" or use Customize modal
4. **Add Modules** — Click pills to expand Capacity, Links, or Gallery
5. **Upload Photos** — Add multiple photos to the gallery
6. **Customize Theme** — Open modal and select background theme
7. **Go Live** — Publish the event with validation

## 📦 Data Model

```typescript
type EventDraft = {
  name: string;
  description?: string;
  phone?: string;
  dateTime?: string;
  location?: string;
  costPerPerson?: string;
  flyerUrl?: string;
  backgroundUrl?: string;
  capacity?: number;
  quickLinks: QuickLink[];
  links: EventLink[];
  gallery: GalleryImage[];
};
```

## 🚀 Future Enhancements

If this were a production app:
- Real backend API integration
- Image upload to CDN (S3, Cloudinary)
- User authentication
- Event sharing/invitations
- RSVP tracking
- Email notifications
