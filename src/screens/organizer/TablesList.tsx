import { useEffect, useState } from 'react';
import { getTables, saveTables, getGuests, saveGuests, Table, Guest, deleteTable, updateTable } from '../../db/mockDb';
import { OrganizerScreen } from '../../OrganizerApp';
import WebApp from '@twa-dev/sdk';
import { Plus, Users, X, Edit2, Trash2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function TablesList() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  
  // Modal state
  const [selectedSeat, setSelectedSeat] = useState<{tableId: string, seatIndex: number} | null>(null);

  // Table Modal state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [newTableShape, setNewTableShape] = useState<'round' | 'rect'>('round');
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);

  const openAddModal = () => {
    setModalMode('add');
    setNewTableName('');
    setNewTableCapacity(8);
    setNewTableShape('round');
    setIsTableModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setModalMode('edit');
    setEditingTableId(table.id);
    setNewTableName(table.name);
    setNewTableCapacity(table.capacity);
    setNewTableShape(table.shape);
    setIsTableModalOpen(true);
  };

  const handleSaveTable = () => {
    if (!newTableName.trim()) return;
    
    if (modalMode === 'add') {
      const newId = `t_${Date.now()}`;
      const newTable: Table = {
        id: newId,
        name: newTableName.trim(),
        shape: newTableShape,
        capacity: newTableCapacity,
        group: 'others'
      };
      const updated = [...tables, newTable];
      setTables(updated);
      saveTables(updated);
    } else if (editingTableId) {
      const tableToUpdate: Table = {
        id: editingTableId,
        name: newTableName.trim(),
        shape: newTableShape,
        capacity: newTableCapacity,
        group: 'others' // Or keep existing if we supported it
      };
      updateTable(tableToUpdate);
      setTables(getTables());
      setGuests(getGuests());
    }
    
    WebApp.HapticFeedback.notificationOccurred('success');
    setIsTableModalOpen(false);
  };

  const handleDeleteTable = (id: string) => {
    deleteTable(id);
    setTables(getTables());
    setGuests(getGuests());
    setTableToDelete(null);
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => navigate('/events/1'));
    return () => WebApp.BackButton.offClick(() => navigate('/events/1'));
  }, [navigate]);

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
              <div className="flex justify-between items-start mb-8 w-full">
                <h2 className="text-xl font-bold text-black dark:text-white">{table.name}</h2>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(table)} className="text-gray-400 hover:text-blue-500 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => setTableToDelete(table.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
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
        onClick={openAddModal}
        className="fixed bottom-8 right-6 bg-blue-500 text-white p-5 rounded-full shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>

      {/* Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm" onClick={() => setIsTableModalOpen(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white">
                {modalMode === 'add' ? 'Новый стол' : 'Редактировать стол'}
              </h3>
              <button onClick={() => setIsTableModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
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
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-black dark:text-white"
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
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-black dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Форма стола</label>
                <div className="flex bg-gray-100 dark:bg-black/50 p-1 rounded-xl">
                  <button 
                    onClick={() => setNewTableShape('round')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newTableShape === 'round' ? 'bg-white dark:bg-gray-800 shadow text-blue-500' : 'text-gray-500'}`}
                  >
                    Круглый
                  </button>
                  <button 
                    onClick={() => setNewTableShape('rect')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newTableShape === 'rect' ? 'bg-white dark:bg-gray-800 shadow text-blue-500' : 'text-gray-500'}`}
                  >
                    Прямоугольный
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveTable}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {modalMode === 'add' ? 'Создать стол' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm" onClick={() => setTableToDelete(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Удалить стол?</h3>
            <p className="text-gray-500 text-sm mb-6">Все гости, сидящие за этим столом, останутся в списке, но потеряют свои места.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setTableToDelete(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-bold py-3 rounded-xl active:scale-95 transition-all"
              >
                Отмена
              </button>
              <button 
                onClick={() => handleDeleteTable(tableToDelete)}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                Удалить
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
