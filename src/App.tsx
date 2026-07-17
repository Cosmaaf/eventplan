import { useState, useEffect } from 'react';
import { initDb } from './db/mockDb';
import DevPanel from './components/DevPanel';
import OrganizerApp from './OrganizerApp';
import GuestApp from './GuestApp';
import LoginApp from './LoginApp';
import WebApp from '@twa-dev/sdk';

export type Role = 'organizer' | 'guest' | 'login';

function App() {
  const [role, setRole] = useState<Role>('login');
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initDb();
      setLoading(false);
    };
    initialize();
    
    // Check for start_param or token from URL
    const initData = WebApp.initDataUnsafe;
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (initData && initData.start_param) {
      setRole('guest');
      setGuestToken(initData.start_param);
    } else if (urlToken) {
      setRole('guest');
      setGuestToken(urlToken);
    } else {
      // Show login
      setRole('login');
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
    <div className="min-h-screen text-black dark:text-white transition-colors duration-500">
      {role === 'login' && <LoginApp onSuccess={() => setRole('organizer')} />}
      {role === 'organizer' && <OrganizerApp />}
      {role === 'guest' && <GuestApp guestToken={guestToken} />}
      
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
