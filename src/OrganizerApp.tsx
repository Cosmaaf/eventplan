import { Routes, Route } from 'react-router-dom';
import EventsList from './screens/organizer/EventsList';
import EventCreate from './screens/organizer/EventCreate';
import EventDetail from './screens/organizer/EventDetail';
import GuestsList from './screens/organizer/GuestsList';
import TablesList from './screens/organizer/TablesList';
import Reminders from './screens/organizer/Reminders';
import Settings from './screens/organizer/Settings';
import TrashBin from './screens/organizer/TrashBin';
import GuestDetail from './screens/organizer/GuestDetail';

export default function OrganizerApp() {
  return (
    <div className="pb-20">
      <Routes>
        <Route path="/" element={<EventsList />} />
        <Route path="/create_event" element={<EventCreate />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/guests" element={<GuestsList />} />
        <Route path="/events/:id/guests/:guestId" element={<GuestDetail />} />
        <Route path="/events/:id/tables" element={<TablesList />} />
        <Route path="/events/:id/reminders" element={<Reminders />} />
        <Route path="/events/:id/settings" element={<Settings />} />
        <Route path="/trash_bin" element={<TrashBin />} />
      </Routes>
    </div>
  );
}
