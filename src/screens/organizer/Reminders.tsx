import { useEffect, useState } from 'react';
import { OrganizerScreen } from '../../OrganizerApp';
import WebApp from '@twa-dev/sdk';
import { Send, CheckSquare, Square } from 'lucide-react';

type Props = {
  onNavigate: (screen: OrganizerScreen) => void;
};

export default function Reminders({ onNavigate }: Props) {
  const [templates, setTemplates] = useState([
    { id: '7d', label: 'За 7 дней до события (Ожидающие ответа)', active: true },
    { id: '3d', label: 'За 3 дня (Подтвердившие участие - дресс-код)', active: false },
    { id: '1d', label: 'За 1 день (Напоминание времени и адреса)', active: true },
  ]);

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => onNavigate('event_detail'));
    return () => WebApp.BackButton.offClick(() => onNavigate('event_detail'));
  }, [onNavigate]);

  const toggle = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const [isSending, setIsSending] = useState(false);

  const sendReminders = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: templates.filter(t => t.active).map(t => t.id) })
      });
      const data = await res.json();
      WebApp.HapticFeedback.notificationOccurred('success');
      WebApp.showAlert(data.message || 'Рассылка успешно выполнена!');
    } catch (e) {
      WebApp.showAlert('Ошибка отправки рассылки.');
    }
    setIsSending(false);
  };

  return (
    <div className="p-5 space-y-6  min-h-screen">
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-6">Напоминания</h1>

      <div className="space-y-4">
        {templates.map(t => (
          <div 
            key={t.id}
            onClick={() => toggle(t.id)}
            className={`p-5 rounded-[24px] flex items-center gap-4 cursor-pointer transition-all border-[2px] shadow-lg hover:scale-[1.01] active:scale-95 ${t.active ? 'bg-blue-50/80 border-blue-400 dark:bg-blue-900/30 dark:border-blue-500' : 'bg-white/50 border-white/40 dark:bg-black/30 dark:border-white/10'}`}
          >
            <div className={`text-${t.active ? 'blue-500' : 'gray-400'}`}>
              {t.active ? <CheckSquare size={28} /> : <Square size={28} />}
            </div>
            <span className="flex-1 font-bold text-gray-900 dark:text-white">{t.label}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={sendReminders}
        disabled={isSending}
        className="w-full mt-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-5 rounded-[20px] font-extrabold text-lg flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(59,130,246,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
      >
        <Send size={24} />
        {isSending ? 'Отправка...' : 'Отправить рассылку'}
      </button>
      
      <p className="text-sm font-medium text-center text-gray-600 dark:text-gray-300 mt-6 bg-white/30 dark:bg-black/30 p-4 rounded-2xl backdrop-blur-md">
        Бот автоматически разошлет эти сообщения гостям, у которых есть Telegram.
      </p>
    </div>
  );
}
