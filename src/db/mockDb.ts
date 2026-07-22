export type EventData = {
  id: number;
  title: string;
  date: string;
  address: string;
  status: string;
  limit: number;
  notes: string;
  photo?: string;
  isDeleted?: boolean;
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
  telegramUsername?: string;
};

export type TableGroup = 'bride' | 'groom' | 'vip' | 'kids' | 'others';

export type Table = {
  id: string;
  name: string;
  shape: 'round' | 'rect';
  capacity: number;
  group: TableGroup;
};

let localCache = {
  events: [] as EventData[],
  guests: [] as Guest[],
  tables: [] as Table[],
  botUsername: 'EventPremium_bot' as string
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const initDb = async () => {
  try {
    const [evRes, guRes, taRes, confRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/guests', { headers: getAuthHeaders() }),
      fetch('/api/tables', { headers: getAuthHeaders() }),
      fetch('/api/config')
    ]);
    const evData = await evRes.json();
    const guData = await guRes.json();
    const taData = await taRes.json();
    
    if (confRes.ok) {
      const confData = await confRes.json();
      if (confData.botUsername) localCache.botUsername = confData.botUsername;
    }

    localCache.events = Array.isArray(evData) ? evData : [];
    localCache.guests = Array.isArray(guData) ? guData : [];
    localCache.tables = Array.isArray(taData) ? taData : [];
  } catch (err) {
    console.error('Failed to load DB:', err);
  }
};

export const initGuestDb = async (guestToken: string) => {
  try {
    const [evRes, guRes] = await Promise.all([
      fetch('/api/events'),
      fetch(`/api/guest/${guestToken}`)
    ]);
    localCache.events = await evRes.json();
    const guestData = await guRes.json();
    if (guestData.success) {
      localCache.guests = [guestData.guest];
      if (guestData.table) {
        localCache.tables = [guestData.table];
      }
    }
  } catch (err) {
    console.error('Failed to load guest DB:', err);
  }
};

export const getEvents = (): EventData[] => {
  return localCache.events.filter(e => !e.isDeleted);
};

export const getDeletedEvents = (): EventData[] => {
  return localCache.events.filter(e => e.isDeleted);
};

export const getEvent = (id?: number): EventData | null => {
  const events = getEvents();
  if (events.length === 0) return null;
  return id ? events.find(e => e.id === id) || null : events[0];
};

export const saveEvent = (event: EventData) => {
  const events = localCache.events;
  const existingIndex = events.findIndex(e => e.id === event.id);
  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.push(event);
  }
  fetch('/api/events', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(event)
  });
};

export const getGuests = (): Guest[] => {
  return localCache.guests;
};

export const saveGuests = (guests: Guest[]) => {
  localCache.guests = guests;
  fetch('/api/guests', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(guests)
  });
};

export const saveGuestRsvp = (guestToken: string, status: GuestStatus, companions: Companion[]) => {
  const guests = localCache.guests;
  const existing = guests.find(g => g.token === guestToken);
  if (existing) {
    existing.status = status;
    existing.companions = companions;
  }
  fetch(`/api/guest/${guestToken}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, companions })
  });
};

export const getTables = (): Table[] => {
  return localCache.tables;
};

export const saveTables = (tables: Table[]) => {
  localCache.tables = tables;
  fetch('/api/tables', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tables)
  });
};

export const deleteTable = (tableId: string) => {
  const updatedTables = localCache.tables.filter(t => t.id !== tableId);
  saveTables(updatedTables);
  
  // Unseat guests from this table
  let changed = false;
  const updatedGuests = localCache.guests.map(g => {
    if (g.tableId === tableId) {
      changed = true;
      return { ...g, tableId: undefined, seatIndex: undefined };
    }
    return g;
  });
  if (changed) saveGuests(updatedGuests);
};

export const updateTable = (updatedTable: Table) => {
  const updatedTables = localCache.tables.map(t => t.id === updatedTable.id ? updatedTable : t);
  saveTables(updatedTables);

  // Check if we need to unseat guests whose seatIndex >= new capacity
  let changed = false;
  const updatedGuests = localCache.guests.map(g => {
    if (g.tableId === updatedTable.id && g.seatIndex !== undefined && g.seatIndex >= updatedTable.capacity) {
      changed = true;
      return { ...g, tableId: undefined, seatIndex: undefined };
    }
    return g;
  });
  if (changed) saveGuests(updatedGuests);
};
