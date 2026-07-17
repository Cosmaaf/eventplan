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
    
    const initData = WebApp.initDataUnsafe;
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const adminInvite = urlParams.get('admin_invite');
    const telegramId = initData?.user?.id?.toString();

    const authCheck = async () => {
      if (adminInvite) {
        // Attempt to join as admin
        try {
          const res = await fetch('/api/auth/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: adminInvite, telegramId })
          });
          const data = await res.json();
          if (data.success) {
            WebApp.showAlert('Вы успешно добавлены как администратор!');
            setRole('organizer');
            return;
          } else {
            WebApp.showAlert(data.error || 'Ошибка активации инвайта');
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (initData && initData.start_param) {
        setRole('guest');
        setGuestToken(initData.start_param);
      } else if (urlToken) {
        setRole('guest');
        setGuestToken(urlToken);
      } else {
        // Check if telegram ID is already admin
        if (telegramId) {
          try {
            const res = await fetch('/api/auth/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegramId })
            });
            const data = await res.json();
            if (data.success) {
              setRole('organizer');
              return;
            }
          } catch (err) {
            console.error(err);
          }
        }
        setRole('login');
      }
    };

    authCheck();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f7] dark:bg-black">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black dark:text-white transition-colors duration-500 relative overflow-hidden">
      {/* Global Animated background bubbles */}
      <div className="fixed -top-20 -left-20 w-96 h-96 bg-blob-1 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob pointer-events-none z-[-1]"></div>
      <div className="fixed top-40 -right-20 w-96 h-96 bg-blob-2 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-2000 pointer-events-none z-[-1]"></div>
      <div className="fixed -bottom-20 left-20 w-96 h-96 bg-blob-3 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-4000 pointer-events-none z-[-1]"></div>

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
