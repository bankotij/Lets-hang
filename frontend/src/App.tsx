import { Routes, Route, Navigate } from 'react-router-dom';
import { CreateEventPage } from './features/event/CreateEventPage';
import { SearchPage } from './features/search/SearchPage';
import { EventDetailPage } from './features/search/EventDetailPage';
import { EditEventPage } from './features/search/EditEventPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { LoginModal } from './components/LoginModal';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/create" element={<CreateEventPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/event/:id/edit" element={<EditEventPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <LoginModal />
    </>
  );
}
