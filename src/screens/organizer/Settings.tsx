import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { OrganizerScreen } from '../../OrganizerApp';

type Props = {
  onNavigate: (screen: OrganizerScreen) => void;
};

export default function Settings({ onNavigate }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => onNavigate('event_detail'));
    return () => WebApp.BackButton.offClick(() => onNavigate('event_detail'));
  }, [onNavigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        WebApp.HapticFeedback.notificationOccurred('success');
        WebApp.showAlert('Пароль успешно изменён!');
        setOldPassword('');
        setNewPassword('');
        onNavigate('event_detail');
      } else {
        WebApp.HapticFeedback.notificationOccurred('error');
        WebApp.showAlert(data.error || 'Ошибка смены пароля');
      }
    } catch (err) {
      WebApp.showAlert('Ошибка соединения');
    }
    setLoading(false);
  };

  return (
    <div className="p-5 space-y-6 min-h-screen">
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-6">Настройки</h1>

      <div className="apple-glass p-6 rounded-[32px] shadow-xl">
        <h2 className="text-xl font-bold mb-4">Смена пароля</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Текущий пароль</label>
            <input 
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Новый пароль</label>
            <input 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading || !oldPassword || !newPassword}
            className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>

      <div className="apple-glass p-6 rounded-[32px] shadow-xl">
        <h2 className="text-xl font-bold mb-2">Пригласить со-организатора</h2>
        <p className="text-sm text-gray-500 mb-4">Сгенерируйте секретную ссылку, чтобы другой человек получил доступ в админку без ввода пароля.</p>
        <button 
          onClick={async () => {
            try {
              const res = await fetch('/api/auth/generate-invite', { 
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
              });
              const data = await res.json();
              if (data.success) {
                const inviteLink = `https://t.me/EventPremium_bot?start=admin_invite_${data.token}`;
                // Let's create an elegant popup or just show alert
                WebApp.showPopup({
                  title: 'Ссылка-приглашение',
                  message: `Отправьте эту ссылку со-организатору:\n\n${inviteLink}\n\nОна скопирована в буфер обмена.`,
                  buttons: [{ type: 'ok' }]
                });
                navigator.clipboard.writeText(inviteLink);
                WebApp.HapticFeedback.notificationOccurred('success');
              }
            } catch (err) {
              WebApp.showAlert('Ошибка генерации ссылки');
            }
          }}
          className="w-full bg-white/10 border border-white/20 text-blue-500 font-bold py-4 rounded-2xl active:scale-95 transition-all"
        >
          Сгенерировать ссылку
        </button>
      </div>
    </div>
  );
}
