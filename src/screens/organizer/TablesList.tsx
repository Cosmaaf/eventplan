import { useEffect, useState } from 'react';
import { getTables, saveTables, getGuests, saveGuests, Table, Guest } from '../../db/mockDb';
import { OrganizerScreen } from '../../OrganizerApp';
import WebApp from '@twa-dev/sdk';
import { Plus, Users, X } from 'lucide-react';

type Props = {
  onNavigate: (screen: OrganizerScreen) => void;
};

export default function TablesList({ onNavigate }: Props) {
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  
  // Modal state
  const [selectedSeat, setSelectedSeat] = useState<{tableId: string, seatIndex: number} | null>(null);

  // Add Table Modal state
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(8);

  const handleAddTable = () => {
    if (!newTableName.trim()) return;
    
    const newId = `t_${Date.now()}`;
    const newTable: Table = {
      id: newId,
      name: newTableName.trim(),
      shape: 'round',
      capacity: newTableCapacity,
      group: 'others'
    };
    const updated = [...tables, newTable];
    setTables(updated);
    saveTables(updated);
    WebApp.HapticFeedback.notificationOccurred('success');
    setIsAddingTable(false);
    setNewTableName('');
    setNewTableCapacity(8);
  };

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => onNavigate('event_detail'));
    return () => WebApp.BackButton.offClick(() => onNavigate('event_detail'));
  }, [onNavigate]);

  useEffect(() => {
    setTables(getTables());
    setGuests(getGuests());
  }, []);

  const unassignedGuests = guests.filter(g => g.status === 'agree' && typeof g.tableId === 'undefined');

  const handleSeatClick = (tableId: string, seatIndex: number) => {
    setSelectedSeat({ tableId, seatIndex });
  };

  const assignGuestToSeat = (guestId: string) => {
    if (!selectedSeat) return;
    
    const updated = guests.map(guest => {
      if (guest.id === guestId) {
        return { ...guest, tableId: selectedSeat.tableId, seatIndex: selectedSeat.seatIndex };
      }
      // If someone else is already at this exact seat, we unassign them
      if (guest.tableId === selectedSeat.tableId && guest.seatIndex === selectedSeat.seatIndex) {
        return { ...guest, tableId: undefined, seatIndex: undefined };
      }
      return guest;
    });
    
    saveGuests(updated);
    setGuests(updated);
    setSelectedSeat(null);
    WebApp.HapticFeedback.impactOccurred('light');
  };

  const removeGuestFromSeat = (guestId: string) => {
    const updated = guests.map(guest => {
      if (guest.id === guestId) {
        return { ...guest, tableId: undefined, seatIndex: undefined };
      }
      return guest;
    });
    saveGuests(updated);
    setGuests(updated);
    setSelectedSeat(null);
    WebApp.HapticFeedback.impactOccurred('light');
  };

  return (
    <div className="p-5 space-y-8 pb-32 min-h-screen">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-black dark:text-white">Схема зала</h1>
      <p className="text-gray-500 mb-6 text-sm">Нажмите на стул, чтобы посадить гостя</p>

      <div className="space-y-12">
        {tables.map(table => {
          const tableGuests = guests.filter(g => g.tableId === table.id);
          const seats = Array.from({ length: table.capacity });
          
          return (
            <div key={table.id} className="ios-card p-6 flex flex-col items-center relative shadow-sm border border-black/5 dark:border-white/10 mt-6">
              <h2 className="text-xl font-bold mb-8 text-center text-black dark:text-white">{table.name}</h2>
              
              <div className="relative flex items-center justify-center w-full max-w-[280px] aspect-square mx-auto">
                {/* Table Shape */}
                <div className={`absolute inset-12 bg-white dark:bg-[#2c2c2e] shadow-lg border-[4px] border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center z-10 ${table.shape === 'round' ? 'rounded-full' : 'rounded-3xl'}`}>
                  <Users size={24} className="text-gray-400 mb-1" />
                  <span className="text-gray-500 font-bold">{tableGuests.length}/{table.capacity}</span>
                </div>

                {/* Seats */}
                {seats.map((_, i) => {
                  const angle = (i / table.capacity) * 360;
                  const radius = 42; // Percentage distance from center
                  
                  const seatedGuest = tableGuests.find(g => g.seatIndex === i);
                  
                  return (
                    <div 
                      key={i}
                      onClick={() => handleSeatClick(table.id, i)}
                      className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-md z-20 ${seatedGuest ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600'}`}
                      style={{
                        top: `${50 - Math.cos(angle * Math.PI / 180) * radius}%`,
                        left: `${50 + Math.sin(angle * Math.PI / 180) * radius}%`,
                      }}
                    >
                      {seatedGuest ? (
                        <div className="flex flex-col items-center justify-center w-full h-full p-1 leading-none">
                          <span className="text-[10px] font-bold text-center truncate w-full">{seatedGuest.firstName}</span>
                          <span className="text-[9px] font-medium text-center truncate w-full opacity-90">{seatedGuest.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium">{i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => setIsAddingTable(true)}
        className="fixed bottom-8 right-6 bg-blue-500 text-white p-5 rounded-full shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add Table Modal */}
      {isAddingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddingTable(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white">Новый стол</h3>
              <button onClick={() => setIsAddingTable(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Название стола</label>
                <input 
                  type="text"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Количество мест</label>
                <input 
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={e => setNewTableCapacity(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              
              <button 
                onClick={handleAddTable}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                Создать стол
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Assignment Modal */}
      {selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSeat(null)}>
          <div 
            className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white">Место {selectedSeat.seatIndex + 1}</h3>
              <button onClick={() => setSelectedSeat(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            {(() => {
              const currentGuest = guests.find(g => g.tableId === selectedSeat.tableId && g.seatIndex === selectedSeat.seatIndex);
              
              return (
                <>
                  {currentGuest && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">Сейчас сидит:</p>
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-[#2c2c2e] p-4 rounded-xl">
                        <span className="font-bold">{currentGuest.firstName} {currentGuest.lastName}</span>
                        <button onClick={() => removeGuestFromSeat(currentGuest.id)} className="text-red-500 text-sm font-bold bg-red-100 dark:bg-red-500/20 px-3 py-1 rounded-lg">
                          Освободить
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-3">Выберите гостя для посадки:</p>
                  <div className="space-y-2">
                    {unassignedGuests.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">Нет свободных гостей</div>
                    ) : (
                      unassignedGuests.map(guest => (
                        <div 
                          key={guest.id}
                          onClick={() => assignGuestToSeat(guest.id)}
                          className="p-4 bg-gray-50 dark:bg-[#2c2c2e] rounded-xl flex justify-between items-center cursor-pointer active:scale-[0.98]"
                        >
                          <span className="font-medium text-black dark:text-white">{guest.firstName} {guest.lastName}</span>
                          <Plus size={18} className="text-blue-500" />
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
