export type EventData = {
  id: number;
  title: string;
  date: string;
  address: string;
  status: string;
  limit: number;
  notes: string;
  photo?: string;
};

export type GuestStatus = 'prepared' | 'invited' | 'agree' | 'disagree';

export type Companion = {
  name: string;
  age?: number;
};

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: GuestStatus;
  token: string;
  tableId?: string;
  seatIndex?: number;
  companions: Companion[];
};

export type TableGroup = 'bride' | 'groom' | 'vip' | 'kids' | 'others';

export type Table = {
  id: string;
  name: string;
  shape: 'round' | 'rect';
  capacity: number;
  group: TableGroup;
};

export const initDb = () => {
  if (!localStorage.getItem('events')) {
    const defaultEvents: EventData[] = [{
      id: 1,
      title: 'Свадьба Давидян',
      date: '2026-08-29T18:00',
      address: 'LOFTHALL, ул. Жужа д.3, Москва',
      status: 'active',
      limit: 100,
      notes: 'Dress code: Black Tie',
    }];
    localStorage.setItem('events', JSON.stringify(defaultEvents));
  }

  if (!localStorage.getItem('guests')) {
    const defaultGuests: Guest[] = Array.from({ length: 12 }).map((_, i) => {
      const statuses: GuestStatus[] = ['prepared', 'invited', 'agree', 'disagree'];
      const st = statuses[i % 4];
      return {
        id: `g_${i}`,
        firstName: `Гость ${i + 1}`,
        lastName: `Фамилия ${i + 1}`,
        phone: `+799900000${i.toString().padStart(2, '0')}`,
        status: st,
        token: `guest_${i + 1}`,
        companions: st === 'agree' && i % 2 === 0 ? [{ name: 'Спутник 1' }] : []
      };
    });
    localStorage.setItem('guests', JSON.stringify(defaultGuests));
  }

  if (!localStorage.getItem('tables')) {
    const defaultTables: Table[] = [
      { id: 't_1', name: 'Стол молодых', shape: 'rect', capacity: 2, group: 'bride' },
      { id: 't_2', name: 'Семья жениха', shape: 'round', capacity: 10, group: 'groom' },
      { id: 't_3', name: 'VIP Гости', shape: 'round', capacity: 8, group: 'vip' },
    ];
    localStorage.setItem('tables', JSON.stringify(defaultTables));
  }
};

export const resetDb = () => {
  localStorage.clear();
  initDb();
};

export const getEvents = (): EventData[] => {
  const data = localStorage.getItem('events');
  return data ? JSON.parse(data) : [];
};

export const getEvent = (id?: number): EventData | null => {
  const events = getEvents();
  if (events.length === 0) return null;
  return id ? events.find(e => e.id === id) || null : events[0];
};

export const saveEvent = (event: EventData) => {
  const events = getEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);
  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.push(event);
  }
  localStorage.setItem('events', JSON.stringify(events));
};

export const getGuests = (): Guest[] => {
  const data = localStorage.getItem('guests');
  return data ? JSON.parse(data) : [];
};

export const saveGuests = (guests: Guest[]) => {
  localStorage.setItem('guests', JSON.stringify(guests));
};

export const getTables = (): Table[] => {
  const data = localStorage.getItem('tables');
  return data ? JSON.parse(data) : [];
};

export const saveTables = (tables: Table[]) => {
  localStorage.setItem('tables', JSON.stringify(tables));
};
