import { useState, useEffect } from 'react';
import { initDb } from './db/mockDb';
import DevPanel from './components/DevPanel';
import OrganizerApp from './OrganizerApp';
import GuestApp from './GuestApp';
import WebApp from '@twa-dev/sdk';

export type Role = 'organizer' | 'guest';

function App() {
  const [role, setRole] = useState<Role>('organizer');
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initDb();
      setLoading(false);
    };
    initialize();
    
    // Check for startapp param from Telegram
    const initData = WebApp.initDataUnsafe;
    if (initData && initData.start_param) {
      setRole('guest');
      setGuestToken(initData.start_param);
    } else {
      // For testing, we can check hash or just default to organizer
      const hash = window.location.hash;
      if (hash.startsWith('#guest_')) {
        setRole('guest');
        setGuestToken(hash.replace('#', ''));
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f7] dark:bg-black">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black text-black dark:text-white transition-colors duration-500">
      {role === 'organizer' ? (
        <OrganizerApp />
      ) : (
        <GuestApp guestToken={guestToken} />
      )}
      
      <DevPanel 
        currentRole={role} 
        onSwitchRole={(r, token) => {
          setRole(r);
          setGuestToken(token || null);
        }} 
      />
    </div>
  );
}

export default App;
