import { useEffect, useState } from 'react';
import { getEvent, getGuests, saveGuests, getTables, Guest, Companion, EventData } from './db/mockDb';
import WebApp from '@twa-dev/sdk';
import { MapPin, Calendar, Heart, Plus, Minus, UserCheck, Check } from 'lucide-react';

type Props = {
  guestToken: string | null;
};

export default function GuestApp({ guestToken }: Props) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const ev = getEvent();
    setEvent(ev);

    if (guestToken) {
      const guests = getGuests();
      const me = guests.find(g => g.token === guestToken);
      if (me) {
        setGuest(me);
        if (me.companions) {
          setCompanions(me.companions);
        }
        if (me.status === 'agree' || me.status === 'disagree') {
          setSubmitted(true);
        }
        if (me.tableId) {
          const table = getTables().find(t => t.id === me.tableId);
          if (table) setTableName(table.name);
        }
      }
    }
  }, [guestToken]);

  if (!event || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center premium-bg">
        <div className="animate-pulse text-xl text-gray-500 font-serif">Загрузка приглашения...</div>
      </div>
    );
  }

  const handleAgree = () => {
    setShowForm(true);
    WebApp.HapticFeedback.impactOccurred('light');
  };

  const handleDisagree = () => {
    updateStatus('disagree');
  };

  const updateStatus = (status: 'agree' | 'disagree') => {
    const allGuests = getGuests();
    const updated = allGuests.map(g => {
      if (g.id === guest.id) {
        return { ...g, status, companions };
      }
      return g;
    });
    saveGuests(updated);
    setGuest({ ...guest, status, companions });
    setSubmitted(true);
    setShowForm(false);
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  const addCompanion = () => {
    setCompanions([...companions, { name: '' }]);
  };

  const updateCompanion = (index: number, name: string) => {
    const newC = [...companions];
    newC[index].name = name;
    setCompanions(newC);
  };

  const removeCompanion = (index: number) => {
    const newC = [...companions];
    newC.splice(index, 1);
    setCompanions(newC);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black text-gray-900 dark:text-white font-sans relative overflow-x-hidden pb-10 transition-colors duration-500">
      <div className="absolute top-0 w-full h-80 z-0">
        {event.photo ? (
          <>
            <div 
              className="w-full h-full bg-cover bg-center absolute" 
              style={{ backgroundImage: `url(${event.photo})` }} 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent" />
        )}
      </div>

      <div className="relative z-10 pt-48 px-5 text-center space-y-6">
        <div className="ios-card p-8 animate-float shadow-xl border border-black/5 dark:border-white/10">
          <div className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Heart size={32} className="text-pink-500 animate-pulse drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            {event.title}
          </h1>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-6">
            Дорогой(ая) {guest.firstName} {guest.lastName}!
          </p>
          <p className="text-md text-gray-600 dark:text-gray-400 mb-6 font-medium">
            Мы рады пригласить вас разделить с нами этот особенный день.
          </p>
          
          <div className="space-y-4 text-left border-t border-black/10 dark:border-white/10 pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-black/5 dark:bg-white/10 p-3 rounded-2xl text-pink-500 shadow-inner">
                <Calendar size={22} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Когда</div>
                <div className="font-bold text-gray-800 dark:text-white">{new Date(event.date).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-black/5 dark:bg-white/10 p-3 rounded-2xl text-blue-500 shadow-inner">
                <MapPin size={22} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Где</div>
                <div className="font-bold text-gray-800 dark:text-white">{event.address}</div>
              </div>
            </div>
          </div>
        </div>

        {tableName && (
          <div className="ios-card p-5 flex items-center justify-center gap-3 animate-bounce shadow-lg border border-black/5 dark:border-white/10" style={{ animationDuration: '3s' }}>
            <div className="bg-green-500/20 p-2 rounded-full">
              <UserCheck className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <span className="text-lg font-medium">Ваше место: <strong className="font-extrabold text-green-700 dark:text-green-400">Стол «{tableName}»</strong></span>
          </div>
        )}

        {!submitted && !showForm && (
          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleAgree}
              className="flex-1 bg-gray-900/90 text-white dark:bg-white/90 dark:text-gray-900 py-4 rounded-[20px] font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all backdrop-blur-md"
            >
              Я приду
            </button>
            <button 
              onClick={handleDisagree}
              className="flex-1 ios-card border border-black/5 dark:border-white/10 text-gray-900 dark:text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              Не смогу
            </button>
          </div>
        )}

        {showForm && !submitted && (
          <div className="ios-card p-6 text-left mt-4 transition-all duration-500 shadow-xl origin-bottom border border-black/5 dark:border-white/10">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
              С кем вы придете?
              <span className="text-xs font-normal text-gray-500 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-full">Макс. 5</span>
            </h3>
            
            <div className="space-y-3 mb-6">
              {companions.map((comp, i) => (
                <div key={i} className="flex gap-3 items-center group">
                  <input 
                    type="text" 
                    placeholder="Имя и Фамилия" 
                    value={comp.name}
                    onChange={e => updateCompanion(i, e.target.value)}
                    className="flex-1 bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 focus:border-pink-400 p-4 rounded-2xl outline-none shadow-inner font-medium placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  />
                  <button onClick={() => removeCompanion(i)} className="p-4 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-colors">
                    <Minus size={20} />
                  </button>
                </div>
              ))}
              
              {companions.length < 5 && (
                <button onClick={addCompanion} className="w-full flex justify-center items-center gap-2 text-pink-600 dark:text-pink-400 font-bold py-4 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 transition-colors mt-2">
                  <Plus size={20} /> Добавить спутника (+1)
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                // Validation: Prevent empty companion names
                if (companions.some(c => c.name.trim() === '')) {
                  WebApp.showAlert('Пожалуйста, заполните имена всех спутников или удалите пустые поля.');
                  WebApp.HapticFeedback.notificationOccurred('error');
                  return;
                }
                updateStatus('agree');
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-[20px] font-bold text-lg shadow-[0_8px_30px_rgba(236,72,153,0.4)] hover:shadow-[0_8px_40px_rgba(236,72,153,0.6)] active:scale-95 transition-all"
            >
              Подтвердить участие
            </button>
          </div>
        )}

        {submitted && (
          <div className="ios-card p-8 mt-4 shadow-xl text-center border border-black/5 dark:border-white/10">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${guest.status === 'agree' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">
              {guest.status === 'agree' ? 'Ждем вас!' : 'Нам очень жаль'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {guest.status === 'agree' 
                ? 'Ваш ответ сохранен. Вы можете вернуться к этому приглашению в любой момент, чтобы увидеть номер вашего стола.' 
                : 'Ваш ответ сохранен. Надеемся увидеть вас в другой раз!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
