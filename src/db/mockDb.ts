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
  tables: [] as Table[]
};

export const initDb = async () => {
  try {
    const [evRes, guRes, taRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/guests'),
      fetch('/api/tables')
    ]);
    localCache.events = await evRes.json();
    localCache.guests = await guRes.json();
    localCache.tables = await taRes.json();
  } catch (err) {
    console.error('Failed to load DB:', err);
  }
};

export const resetDb = () => {
  // Not used in production, maybe keep a mock implementation or remove
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guests)
  });
};

export const getTables = (): Table[] => {
  return localCache.tables;
};

export const saveTables = (tables: Table[]) => {
  localCache.tables = tables;
  fetch('/api/tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
