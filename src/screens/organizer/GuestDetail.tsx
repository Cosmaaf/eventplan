import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGuests, Guest } from '../../db/mockDb';
import WebApp from '@twa-dev/sdk';

export default function GuestDetail() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => navigate('/events/1/guests'));
    
    const guests = getGuests();
    const found = guests.find(g => g.id === guestId);
    if (found) {
      setGuest(found);
    }
    
    return () => WebApp.BackButton.offClick(() => navigate('/events/1/guests'));
  }, [guestId, navigate]);

  if (!guest) {
    return <div className="p-5 text-center text-gray-500">Гость не найден</div>;
  }

  return (
    <div className="p-5 space-y-6 min-h-screen pb-32">
      <div className="apple-glass rounded-[32px] w-full p-8 shadow-2xl">
        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{guest.firstName} {guest.lastName}</h3>
        <p className="text-gray-500 mb-6 font-medium">{guest.phone}</p>
        
        <div className="space-y-4 mb-6">
          <div className="bg-white/50 dark:bg-black/30 p-4 rounded-2xl border border-white/40 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-1">Статус</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {guest.status === 'agree' ? '✅ Придет' : 
               guest.status === 'disagree' ? '❌ Не придет' : 
               guest.status === 'invited' ? '⏳ Ожидает ответа' : '📝 В списке'}
            </p>
          </div>

          {guest.companions && guest.companions.length > 0 && (
            <div className="bg-white/50 dark:bg-black/30 p-4 rounded-2xl border border-white/40 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-3">Спутники ({guest.companions.length})</p>
              <ul className="space-y-2">
                {guest.companions.map((comp, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-white/40 dark:bg-white/5 p-3 rounded-xl">
                    <span className="font-medium text-gray-900 dark:text-white">{comp.name}</span>
                    {comp.age && <span className="text-sm text-gray-500">{comp.age} лет</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
