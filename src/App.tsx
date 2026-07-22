import { useState, useEffect } from 'react';
import { initDb } from './db/mockDb';
import OrganizerApp from './OrganizerApp';
import GuestApp from './GuestApp';
import LoginApp from './LoginApp';
import WebApp from '@twa-dev/sdk';
import { Routes, Route, useNavigate } from 'react-router-dom';

export type Role = 'organizer' | 'guest' | 'login';

function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // We will initialize DB later based on role
    
    const initData = WebApp.initDataUnsafe;
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const adminInvite = urlParams.get('admin_invite');
    const telegramInitData = WebApp.initData;

    const authCheck = async () => {
      if (adminInvite) {
        // Attempt to join as admin
        try {
          const res = await fetch('/api/auth/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: adminInvite, telegramInitData })
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('adminToken', data.token);
            WebApp.showAlert('Вы успешно добавлены как администратор!');
            await initDb();
            setRole('organizer');
            setLoading(false);
            return;
          } else {
            WebApp.showAlert(data.error || 'Ошибка активации инвайта');
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (initData && initData.start_param && !initData.start_param.startsWith('admin_invite_')) {
        setGuestToken(initData.start_param);
        setRole('guest');
        setLoading(false);
      } else if (urlToken) {
        setGuestToken(urlToken);
        setRole('guest');
        setLoading(false);
      } else {
        // Check if user is already admin
        if (telegramInitData) {
          try {
            const res = await fetch('/api/auth/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegramInitData })
            });
            const data = await res.json();
            if (data.success) {
              localStorage.setItem('adminToken', data.token);
              await initDb();
              setRole('organizer');
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error(err);
          }
        }
        setRole('login');
        setLoading(false);
      }
    };

    authCheck();
  }, [navigate]);

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

      <Routes>
        <Route path="/invite/:token" element={<GuestApp guestToken={guestToken} />} />
        <Route path="/login" element={
          <LoginApp onSuccess={async () => {
            setLoading(true);
            await initDb();
            setRole('organizer');
            setLoading(false);
            navigate('/');
          }} />
        } />
        <Route path="/*" element={
          role === 'organizer' ? <OrganizerApp /> : 
          role === 'guest' ? <GuestApp guestToken={guestToken} /> : 
          <LoginApp onSuccess={async () => {
            setLoading(true);
            await initDb();
            setRole('organizer');
            setLoading(false);
            navigate('/');
          }} />
        } />
      </Routes>
    </div>
  );
}

export default App;
