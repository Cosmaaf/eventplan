import { useEffect, useState } from 'react';
import { getDeletedEvents, saveEvent, EventData } from '../../db/mockDb';
import { OrganizerScreen } from '../../OrganizerApp';
import WebApp from '@twa-dev/sdk';
import { RefreshCcw, Trash2 } from 'lucide-react';

type Props = {
  onNavigate: (screen: OrganizerScreen) => void;
};

export default function TrashBin({ onNavigate }: Props) {
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => onNavigate('events'));
    
    setEvents(getDeletedEvents());
    
    return () => WebApp.BackButton.offClick(() => onNavigate('events'));
  }, [onNavigate]);

  const handleRestore = (id: number) => {
    const event = getDeletedEvents().find(e => e.id === id);
    if (event) {
      event.isDeleted = false;
      saveEvent(event);
      setEvents(getDeletedEvents());
      WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    WebApp.showConfirm('Вы уверены, что хотите безвозвратно удалить это мероприятие?', async (confirmed) => {
      if (confirmed) {
        try {
          await fetch(`/api/events/${id}`, { method: 'DELETE' });
          setEvents(events.filter(e => e.id !== id));
          WebApp.HapticFeedback.notificationOccurred('success');
        } catch(e) {}
      }
    });
  };

  return (
    <div className="p-5 space-y-6 pb-32 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">Корзина</h1>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? events.map(event => (
          <div key={event.id} className="apple-glass rounded-3xl p-5 border border-black/5 dark:border-white/10 bg-white dark:bg-[#1c1c1e]">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{event.title}</h2>
            <div className="text-sm text-gray-500 mb-4">Удалено</div>
            
            <div className="flex gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/10">
              <button 
                onClick={() => handleRestore(event.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 font-bold py-3 rounded-xl transition-all"
              >
                <RefreshCcw size={18} />
                Восстановить
              </button>
              <button 
                onClick={() => handlePermanentDelete(event.id)}
                className="flex items-center justify-center bg-red-500/10 text-red-500 p-3 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-10 text-gray-500">
            <p>Корзина пуста</p>
          </div>
        )}
      </div>
    </div>
  );
}
