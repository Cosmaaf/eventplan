import { useState } from 'react';
import EventsList from './screens/organizer/EventsList';
import EventCreate from './screens/organizer/EventCreate';
import EventDetail from './screens/organizer/EventDetail';
import GuestsList from './screens/organizer/GuestsList';
import TablesList from './screens/organizer/TablesList';
import Reminders from './screens/organizer/Reminders';

export type OrganizerScreen = 'events' | 'create_event' | 'event_detail' | 'guests' | 'tables' | 'reminders';

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
    </div>
  );
}
