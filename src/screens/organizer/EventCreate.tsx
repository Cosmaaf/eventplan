import React, { useState, useEffect } from 'react';
import { saveEvent, EventData } from '../../db/mockDb';
import WebApp from '@twa-dev/sdk';
import { Camera } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function EventCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<EventData>>({
    title: '',
    date: '',
    address: '',
    limit: 50,
    notes: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => navigate('/'));
    return () => WebApp.BackButton.offClick(() => navigate('/'));
  }, [navigate]);

  useEffect(() => {
    const isValid = formData.title && formData.date && formData.address;
    if (isValid) {
      WebApp.MainButton.setText('СОХРАНИТЬ');
      WebApp.MainButton.show();
      WebApp.MainButton.onClick(handleSave);
    } else {
      WebApp.MainButton.hide();
    }
    
    return () => WebApp.MainButton.offClick(handleSave);
  }, [formData, photo]);

  const handleSave = () => {
    const newEvent: EventData = {
      id: Date.now(),
      title: formData.title!,
      date: formData.date!,
      address: formData.address!,
      limit: formData.limit || 50,
      notes: formData.notes || '',
      status: 'active',
      photo: photo || undefined,
    };
    saveEvent(newEvent);
    WebApp.HapticFeedback.notificationOccurred('success');
    WebApp.showAlert('Успешно сохранено', () => {
      navigate('/');
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-5 space-y-6 pb-32 bg-[#f2f2f7] dark:bg-black min-h-screen">
      <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/10">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Новое мероприятие</h1>

        <div className="flex flex-col items-center justify-center border border-white/40 dark:border-white/10 rounded-[24px] h-48 relative overflow-hidden bg-white/30 dark:bg-black/30 shadow-inner group transition-all">
          {photo ? (
            <img src={photo} alt="Event" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <Camera size={40} className="mb-3 text-pink-500 opacity-80" />
              <span className="font-medium">Загрузить обложку</span>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="space-y-5 mt-6">
          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">Название</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="box-border max-w-full w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder-gray-400"
              placeholder="Свадьба Анны и Ивана"
            />
          </div>

          <div className="overflow-hidden">
            <label className="block text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">Дата и время</label>
            <input 
              type="datetime-local" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="box-border max-w-full w-full appearance-none bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium m-0"
            />
          </div>

          <div className="overflow-hidden">
            <label className="block text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">Адрес</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="box-border max-w-full w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder-gray-400"
              placeholder="Ресторан, улица..."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 overflow-hidden">
              <label className="block text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">Лимит гостей</label>
              <input 
                type="number" 
                value={formData.limit}
                onChange={e => setFormData({...formData, limit: parseInt(e.target.value)})}
                className="box-border max-w-full w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="overflow-hidden">
            <label className="block text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">Дресс-код / Заметки</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="box-border max-w-full w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder-gray-400 min-h-[120px]"
              placeholder="Дресс-код: Black Tie..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
