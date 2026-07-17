import { useState } from 'react';
import EventsList from './screens/organizer/EventsList';
import EventCreate from './screens/organizer/EventCreate';
import EventDetail from './screens/organizer/EventDetail';
import GuestsList from './screens/organizer/GuestsList';
import TablesList from './screens/organizer/TablesList';
import Reminders from './screens/organizer/Reminders';
import Settings from './screens/organizer/Settings';
import TrashBin from './screens/organizer/TrashBin';

export type OrganizerScreen = 'events' | 'create_event' | 'event_detail' | 'guests' | 'tables' | 'reminders' | 'settings' | 'trash_bin';

export default function OrganizerApp() {
  const [currentScreen, setCurrentScreen] = useState<OrganizerScreen>('events');

  const navigate = (screen: OrganizerScreen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  return (
    <div className="pb-20">
      {currentScreen === 'events' && <EventsList onNavigate={navigate} />}
      {currentScreen === 'create_event' && <EventCreate onNavigate={navigate} />}
      {currentScreen === 'event_detail' && <EventDetail onNavigate={navigate} />}
      {currentScreen === 'guests' && <GuestsList onNavigate={navigate} />}
      {currentScreen === 'tables' && <TablesList onNavigate={navigate} />}
      {currentScreen === 'reminders' && <Reminders onNavigate={navigate} />}
      {currentScreen === 'settings' && <Settings onNavigate={navigate} />}
      {currentScreen === 'trash_bin' && <TrashBin onNavigate={navigate} />}
    </div>
  );
}
