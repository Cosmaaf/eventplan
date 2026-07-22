import { useEffect, useState } from 'react';
import { getEvents, EventData, getGuests } from '../../db/mockDb';
import { Calendar, MapPin, Plus, ChevronRight } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

import { useNavigate } from 'react-router-dom';

export default function EventsList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [guestStats, setGuestStats] = useState({ total: 0, invited: 0, agree: 0, disagree: 0 });
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  useEffect(() => {
    WebApp.BackButton.hide();
    
    const evs = getEvents();
    setEvents(evs);
    
    if (evs.length > 0) {
      const guests = getGuests();
      setGuestStats({
        total: guests.length,
        invited: guests.filter(g => g.status === 'invited').length,
        agree: guests.filter(g => g.status === 'agree').length,
        disagree: guests.filter(g => g.status === 'disagree').length,
      });
    }
  }, []);

  const handleDelete = async (id: number) => {
    const event = getEvents().find(e => e.id === id);
    if (event) {
      event.isDeleted = true;
      // In mockDb, we need to call saveEvent to persist the change to server
      const { saveEvent } = await import('../../db/mockDb');
      saveEvent(event);
      setEvents(getEvents());
      WebApp.HapticFeedback.notificationOccurred('success');
    }
    setEventToDelete(null);
  };

  return (
    <div className="p-5 space-y-6  min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">Мероприятия</h1>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? events.map(event => (
          <div 
            key={event.id}
            onClick={() => navigate('/events/1')}
            className="apple-glass rounded-[32px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/5 dark:border-white/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden group bg-white dark:bg-[#1c1c1e]"
          >
            {event.photo ? (
              <div className="h-40 -mx-5 -mt-5 mb-5 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${event.photo})` }} />
            ) : (
              <div className="h-40 -mx-5 -mt-5 mb-5 bg-gradient-to-br from-blue-400 to-purple-500 opacity-80" />
            )}
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-extrabold mb-2 text-gray-900 dark:text-white">{event.title}</h2>
                <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  <Calendar size={16} className="mr-2 text-blue-500" />
                  {new Date(event.date).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
                <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  <MapPin size={16} className="mr-2 flex-shrink-0 text-pink-500" />
                  <span className="truncate max-w-[200px]">{event.address}</span>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="mt-5 flex gap-4 border-t border-black/5 dark:border-white/10 pt-5">
              <div className="text-center flex-1 bg-black/5 dark:bg-white/5 p-2 rounded-2xl">
                <div className="text-lg font-bold text-gray-800 dark:text-white">{guestStats.total}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Всего</div>
              </div>
              <div className="text-center flex-1 bg-blue-500/10 p-2 rounded-2xl text-blue-600 dark:text-blue-400">
                <div className="text-lg font-bold">{guestStats.invited}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider">Приглашено</div>
              </div>
              <div className="text-center flex-1 bg-green-500/10 p-2 rounded-2xl text-green-600 dark:text-green-400">
                <div className="text-lg font-bold">{guestStats.agree}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider">Идут</div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEventToDelete(event.id);
                }}
                className="text-red-500 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-10 text-gray-500">
            <p>Нет мероприятий</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/events/new')}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-[20px] font-bold text-lg shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_8px_40px_rgba(59,130,246,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
      >
        <Plus size={24} />
        Создать мероприятие
      </button>

      <button 
        onClick={() => navigate('/trash')}
        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-2"
      >
        Корзина
      </button>

      {/* Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm" onClick={() => setEventToDelete(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Удалить мероприятие?</h3>
            <p className="text-gray-500 text-sm mb-6">Оно будет перемещено в Корзину, откуда его можно будет восстановить.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setEventToDelete(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-bold py-3 rounded-xl active:scale-95 transition-all"
              >
                Отмена
              </button>
              <button 
                onClick={() => handleDelete(eventToDelete)}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
