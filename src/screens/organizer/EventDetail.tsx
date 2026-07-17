import { useEffect, useState } from 'react';
import { getEvent, EventData, getGuests, saveEvent } from '../../db/mockDb';
import { OrganizerScreen } from '../../OrganizerApp';
import WebApp from '@twa-dev/sdk';
import { Users, LayoutDashboard, Bell, Edit3 } from 'lucide-react';

type Props = {
  onNavigate: (screen: OrganizerScreen) => void;
};

export default function EventDetail({ onNavigate }: Props) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => onNavigate('events'));
    return () => WebApp.BackButton.offClick(() => onNavigate('events'));
  }, [onNavigate]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const e = getEvent();
    setEvent(e);
    if (e) setNewTitle(e.title);
    setGuestCount(getGuests().length);
    WebApp.MainButton.hide();
  }, []);

  if (!event) return null;

  const handleSaveTitle = () => {
    if (newTitle.trim()) {
      const updated = { ...event, title: newTitle.trim() };
      setEvent(updated);
      saveEvent(updated); // I need to make sure saveEvent is imported
    }
    setIsEditingTitle(false);
  };

  const features = [
    { id: 'guests', title: 'Список гостей', icon: <Users size={24} />, desc: `${guestCount} гостей`, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'tables', title: 'Рассадка', icon: <LayoutDashboard size={24} />, desc: 'Управление столами', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'reminders', title: 'Напоминания', icon: <Bell size={24} />, desc: 'Авто-уведомления', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <div className="p-5 space-y-6  min-h-screen">
      <div className="flex justify-between items-center mb-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onBlur={handleSaveTitle}
            autoFocus
            className="text-3xl font-extrabold w-full mr-4 bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-white"
          />
        ) : (
          <h1 className="text-3xl font-extrabold truncate pr-4 text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">{event.title}</h1>
        )}
        <button 
          onClick={() => {
            if (isEditingTitle) handleSaveTitle();
            else setIsEditingTitle(true);
          }}
          className="p-3 rounded-full bg-white/50 dark:bg-black/30 shadow-sm text-blue-500 hover:scale-105 active:scale-95 transition-all"
        >
          <Edit3 size={24} />
        </button>
      </div>

      <div className="apple-glass rounded-[32px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5 border-b border-white/20 dark:border-white/10 pb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Дата проведения</div>
            <div className="font-extrabold text-lg text-gray-900 dark:text-white">{new Date(event.date).toLocaleDateString('ru-RU')}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Осталось дней</div>
            <div className="font-extrabold text-2xl text-blue-500">
              {Math.max(0, Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 3600 * 24)))}
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Адрес</div>
          <div className="font-extrabold text-gray-900 dark:text-white">{event.address}</div>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold mt-10 mb-4 text-gray-900 dark:text-white">Управление</h2>
      
      <div className="grid grid-cols-2 gap-4 pb-20">
        {features.map(f => (
          <div 
            key={f.id}
            onClick={() => onNavigate(f.id as OrganizerScreen)}
            className="apple-glass rounded-[24px] p-5 shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col items-start"
          >
            <div className={`p-4 rounded-[20px] mb-4 ${f.bg} ${f.color} shadow-inner`}>
              {f.icon}
            </div>
            <h3 className="font-extrabold text-gray-900 dark:text-white mb-1">{f.title}</h3>
            <p className="text-xs font-medium text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
