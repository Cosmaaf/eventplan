import { useEffect, useState } from 'react';
import { getGuests, saveGuests, Guest, GuestStatus, localCache } from '../../db/mockDb';
import WebApp from '@twa-dev/sdk';
import { Search, UserPlus, Check, Send } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function GuestsList() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tab, setTab] = useState<'prepared' | 'invited' | 'responded'>('prepared');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', phone: '', telegramUsername: '' });
  const [selectedGuestDetail, setSelectedGuestDetail] = useState<Guest | null>(null);
  
  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => navigate('/events/1'));
    return () => WebApp.BackButton.offClick(() => navigate('/events/1'));
  }, [navigate]);

  useEffect(() => {
    setGuests(getGuests());
  }, []);

  const filteredGuests = guests.filter(g => 
    (g.firstName.toLowerCase().includes(search.toLowerCase()) || 
     g.lastName.toLowerCase().includes(search.toLowerCase()) || 
     g.phone.includes(search))
  );

  const guestsByTab = filteredGuests.filter(g => {
    if (tab === 'prepared') return g.status === 'prepared';
    if (tab === 'invited') return g.status === 'invited';
    if (tab === 'responded') return g.status === 'agree' || g.status === 'disagree';
    return true;
  });

  const toggleSelect = (id: string) => {
    const newSel = new Set(selected);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelected(newSel);
  };

  const inviteSelected = () => {
    if (selected.size === 0) return;
    const updated = guests.map(g => {
      if (selected.has(g.id) && g.status === 'prepared') {
        return { ...g, status: 'invited' as GuestStatus };
      }
      return g;
    });
    saveGuests(updated);
    setGuests(updated);

    // Generate link for the first selected guest to share
    const firstSelectedId = Array.from(selected)[0];
    const firstGuest = guests.find(g => g.id === firstSelectedId);
    
    if (firstGuest) {
      const inviteLink = `https://t.me/${localCache.botUsername}?start=${firstGuest.token}`;
      const text = `Привет! Приглашаю тебя на мероприятие: ${inviteLink}`;
      
      if (firstGuest.telegramUsername) {
        // Direct message link
        const username = firstGuest.telegramUsername.replace('@', '');
        WebApp.openTelegramLink(`https://t.me/${username}?text=${encodeURIComponent(text)}`);
      } else {
        // Fallback to share
        WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(text)}`);
      }
    }

    setSelected(new Set());
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  const handleAddGuest = () => {
    if (newGuest.firstName.trim().length < 2) {
      WebApp.showAlert('Введите корректное имя (минимум 2 буквы).');
      return;
    }
    if (newGuest.lastName.trim().length < 2) {
      WebApp.showAlert('Введите корректную фамилию (минимум 2 буквы).');
      return;
    }
    // Phone or username must be provided
    const phoneRegex = /^\+?[0-9\s\-\(\)]{7,18}$/;
    if (!newGuest.phone && !newGuest.telegramUsername) {
      WebApp.showAlert('Укажите номер телефона или Telegram username.');
      return;
    }
    if (newGuest.phone && !phoneRegex.test(newGuest.phone)) {
      WebApp.showAlert('Введите корректный номер телефона.');
      return;
    }

    const g: Guest = {
      id: `g_man_${Date.now()}`,
      firstName: newGuest.firstName.trim(),
      lastName: newGuest.lastName.trim(),
      phone: newGuest.phone.trim(),
      telegramUsername: newGuest.telegramUsername.trim(),
      status: 'prepared',
      token: `guest_man_${Date.now()}`,
      companions: []
    };
    const updated = [...guests, g];
    saveGuests(updated);
    setGuests(updated);
    setShowAddGuest(false);
    setNewGuest({ firstName: '', lastName: '', phone: '', telegramUsername: '' });
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  return (
    <div className="p-5 space-y-6 pb-32  min-h-screen">
      <div className="flex items-center gap-3 bg-white/50 dark:bg-black/30 p-3 rounded-2xl shadow-inner border border-white/40 dark:border-white/10 backdrop-blur-md">
        <Search size={22} className="text-gray-500 dark:text-gray-400 ml-2" />
        <input 
          type="text" 
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none flex-1 py-1 text-gray-900 dark:text-white placeholder-gray-500 font-medium"
        />
      </div>

      <div className="flex p-1 bg-white/40 dark:bg-black/30 rounded-2xl overflow-hidden shadow-inner backdrop-blur-md border border-white/20">
        {[
          { id: 'prepared', label: 'Подготовлены' },
          { id: 'invited', label: 'Приглашены' },
          { id: 'responded', label: 'Ответили' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => { setTab(t.id as any); setSelected(new Set()); }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-white/20'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 mt-6">
        {guestsByTab.map(guest => (
          <div 
            key={guest.id} 
            onClick={() => {
              if (tab === 'prepared') {
                toggleSelect(guest.id);
              } else {
                navigate(`/events/1/guests/${guest.id}`);
              }
            }}
            className="apple-glass p-5 rounded-[24px] shadow-lg flex items-center gap-4 hover:scale-[1.01] transition-transform cursor-pointer"
          >
            {tab === 'prepared' && (
              <div 
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${selected.has(guest.id) ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-gray-400/50'}`}
              >
                {selected.has(guest.id) && <Check size={16} strokeWidth={3} />}
              </div>
            )}
            
            <div className="flex-1">
              <div className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight mb-1">{guest.firstName} {guest.lastName}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{guest.phone}</div>
              {guest.companions && guest.companions.length > 0 && (
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2 bg-blue-500/10 inline-block px-3 py-1 rounded-full">
                  + {guest.companions.length} {guest.companions.length === 1 ? 'спутник' : 'спутника'}
                </div>
              )}
            </div>
            
            {tab === 'responded' && (
              <div>
                {guest.status === 'agree' ? (
                  <span className="text-green-600 dark:text-green-400 bg-green-500/10 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wide">Приду</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 bg-red-500/10 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wide">Отказ</span>
                )}
              </div>
            )}
            {tab === 'invited' && (
              <span className="text-blue-600 dark:text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full text-[10px] font-extrabold text-center leading-tight uppercase tracking-wide">
                Ожидает<br/>ответа
              </span>
            )}
          </div>
        ))}

        {guestsByTab.length === 0 && (
          <div className="text-center py-10 text-tg-hint">
            Список пуст
          </div>
        )}
      </div>

      {tab === 'prepared' && selected.size > 0 && (
        <button 
          onClick={inviteSelected}
          className="fixed bottom-8 left-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-[20px] font-extrabold text-lg flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all z-20"
        >
          <Send size={24} />
          Пригласить ({selected.size})
        </button>
      )}

      {tab === 'prepared' && selected.size === 0 && (
        <button 
          onClick={() => setShowAddGuest(true)}
          className="fixed bottom-8 right-6 bg-gradient-to-br from-pink-500 to-rose-500 text-white p-5 rounded-full shadow-[0_8px_30px_rgba(236,72,153,0.5)] active:scale-95 transition-all z-20 hover:scale-105"
        >
          <UserPlus size={28} />
        </button>
      )}

      {showAddGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="apple-glass rounded-[32px] w-full max-w-sm p-8 space-y-6 shadow-2xl animate-float">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Новый гость</h3>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Имя"
                value={newGuest.firstName}
                onChange={e => setNewGuest({...newGuest, firstName: e.target.value})}
                className="w-full bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-2xl p-4 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all font-medium text-gray-900 dark:text-white"
              />
              <input 
                type="text" 
                placeholder="Фамилия"
                value={newGuest.lastName}
                onChange={e => setNewGuest({...newGuest, lastName: e.target.value})}
                className="w-full bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-2xl p-4 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all font-medium text-gray-900 dark:text-white"
              />
              <input 
                type="tel" 
                placeholder="+7 (999) 000-00-00"
                value={newGuest.phone}
                onChange={e => {
                  let val = e.target.value.replace(/[^\d]/g, '');
                  if (val.startsWith('8')) val = '7' + val.slice(1);
                  if (val.startsWith('9')) val = '7' + val;
                  let formatted = '';
                  if (val.length > 0) {
                    formatted = '+7';
                    if (val.length > 1) formatted += ` (${val.slice(1, 4)}`;
                    if (val.length > 4) formatted += `) ${val.slice(4, 7)}`;
                    if (val.length > 7) formatted += `-${val.slice(7, 9)}`;
                    if (val.length > 9) formatted += `-${val.slice(9, 11)}`;
                  }
                  setNewGuest({...newGuest, phone: formatted || e.target.value});
                }}
                className="w-full bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-2xl p-4 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all font-medium text-gray-900 dark:text-white"
              />
              <input 
                type="text" 
                placeholder="Telegram Username (напр. @ivan)"
                value={newGuest.telegramUsername}
                onChange={e => setNewGuest({...newGuest, telegramUsername: e.target.value})}
                className="w-full bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-2xl p-4 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all font-medium text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddGuest(false)} className="flex-1 p-4 rounded-[20px] bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold active:scale-95 transition-transform">Отмена</button>
              <button onClick={handleAddGuest} className="flex-1 p-4 rounded-[20px] bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold active:scale-95 transition-transform">Добавить</button>
            </div>
          </div>
        </div>
      )}

      {selectedGuestDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={() => setSelectedGuestDetail(null)}>
          <div className="apple-glass rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-float" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{selectedGuestDetail.firstName} {selectedGuestDetail.lastName}</h3>
            <p className="text-gray-500 mb-6 font-medium">{selectedGuestDetail.phone}</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-white/50 dark:bg-black/30 p-4 rounded-2xl border border-white/40 dark:border-white/10">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-1">Статус</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedGuestDetail.status === 'agree' ? '✅ Придет' : 
                   selectedGuestDetail.status === 'disagree' ? '❌ Не придет' : 
                   selectedGuestDetail.status === 'invited' ? '⏳ Ожидает ответа' : '📝 В списке'}
                </p>
              </div>

              {selectedGuestDetail.companions && selectedGuestDetail.companions.length > 0 && (
                <div className="bg-white/50 dark:bg-black/30 p-4 rounded-2xl border border-white/40 dark:border-white/10">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-3">Спутники ({selectedGuestDetail.companions.length})</p>
                  <ul className="space-y-2">
                    {selectedGuestDetail.companions.map((comp, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-white/40 dark:bg-white/5 p-3 rounded-xl">
                        <span className="font-medium text-gray-900 dark:text-white">{comp.name}</span>
                        {comp.age && <span className="text-sm text-gray-500">{comp.age} лет</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedGuestDetail(null)} 
              className="w-full p-4 rounded-[20px] bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold active:scale-95 transition-transform"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
