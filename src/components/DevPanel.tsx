import { useState } from 'react';
import { resetDb, getGuests } from '../db/mockDb';
import { Settings, RefreshCw, Users, User } from 'lucide-react';
import { Role } from '../App';

type Props = {
  currentRole: Role;
  onSwitchRole: (role: Role, token?: string) => void;
};

export default function DevPanel({ currentRole, onSwitchRole }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] bg-gray-800 text-white p-3 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity"
      >
        <Settings size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-xs w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm">Dev Panel</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => {
            resetDb();
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-lg text-sm font-medium"
        >
          <RefreshCw size={16} /> Reset localStorage
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs text-gray-500 mb-2">Switch Role</p>
          <div className="flex gap-2">
            <button 
              onClick={() => onSwitchRole('organizer')}
              className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-medium ${currentRole === 'organizer' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              <Users size={14} /> Org
            </button>
            <button 
              onClick={() => {
                const guests = getGuests();
                const randomGuest = guests[Math.floor(Math.random() * guests.length)];
                onSwitchRole('guest', randomGuest.token);
              }}
              className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-medium ${currentRole === 'guest' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              <User size={14} /> Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
