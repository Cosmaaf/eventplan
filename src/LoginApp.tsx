import { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { Lock, LogIn } from 'lucide-react';

type Props = {
  onSuccess: () => void;
};

export default function LoginApp({ onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (data.success) {
        WebApp.HapticFeedback.notificationOccurred('success');
        onSuccess();
      } else {
        WebApp.HapticFeedback.notificationOccurred('error');
        setError(data.error || 'Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка соединения');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      {/* Animated background bubbles */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-20 -right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-sm glass-panel p-8 rounded-[32px] shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Lock size={36} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-black mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          Панель Организатора
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 text-center">
          Введите пароль для доступа к управлению мероприятием
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-5">
          <div>
            <input 
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 text-center rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium text-center bg-red-100 dark:bg-red-900/30 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button 
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={22} />
                Войти
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
