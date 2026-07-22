import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import { getDb } from './db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(express.json());

const token = process.env.TELEGRAM_BOT_TOKEN;
const amveraUrl = 'https://qwqwe-ilya12321dq.waw0.amvera.tech'; // Amvera URL
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-if-not-set';

if (!token) {
  console.warn("WARNING: TELEGRAM_BOT_TOKEN is not set in environment variables!");
}

function verifyTelegramWebAppData(telegramInitData) {
  if (!telegramInitData) return false;
  try {
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    urlParams.sort();

    let dataCheckString = '';
    for (const [key, value] of urlParams.entries()) {
      dataCheckString += `${key}=${value}\n`;
    }
    dataCheckString = dataCheckString.slice(0, -1);

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculatedHash === hash;
  } catch (err) {
    return false;
  }
}

function parseTelegramId(telegramInitData) {
  try {
    const urlParams = new URLSearchParams(telegramInitData);
    const userStr = urlParams.get('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id.toString();
    }
  } catch (e) {
    return null;
  }
  return null;
}

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid Token' });
  }
};

const bot = new TelegramBot(token || 'dummy:token', { polling: !!token });
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
    // Suppress duplicate instance errors in console
    return;
  }
  console.error('Polling error:', error);
});

(async () => {
  try {
    await bot.setChatMenuButton({
      menu_button: JSON.stringify({
        type: 'web_app',
        text: 'EventPlan',
        web_app: { url: amveraUrl }
      })
    });
    console.log('Menu button set successfully to:', amveraUrl);

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    bot.onText(/\/start (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const startParam = match[1];

      if (startParam.startsWith('admin_invite_')) {
        const token = startParam.replace('admin_invite_', '');
        bot.sendMessage(chatId, 'Вы приглашены стать со-организатором! Нажмите кнопку ниже, чтобы принять приглашение.', {
          reply_markup: {
            inline_keyboard: [[
              { text: 'Принять приглашение', web_app: { url: `${amveraUrl}?admin_invite=${token}` } }
            ]]
          }
        });
        return;
      }

      if (startParam.startsWith('guest_')) {
        const guestToken = startParam;
        const db = await getDb();
        const row = await db.get('SELECT id, data FROM guests WHERE data LIKE ?', [`%"token":"${guestToken}"%`]);
        const eventRow = await db.get('SELECT data FROM events LIMIT 1');
        
        if (row && eventRow) {
          const guestData = JSON.parse(row.data);
          const eventData = JSON.parse(eventRow.data);
          
          await db.run('UPDATE guests SET telegram_id = ? WHERE id = ?', [chatId.toString(), row.id]);

          const messageText = `🎉 Вас приглашают на мероприятие «${eventData.title}»\n📅 ${formatDate(eventData.date)}\n📍 ${eventData.address}\n\nПожалуйста, подтвердите своё участие:`;
          
          bot.sendMessage(chatId, messageText, {
            reply_markup: {
              inline_keyboard: [[
                { text: 'Открыть приглашение', web_app: { url: `${amveraUrl}/#/invite/${guestToken}` } }
              ]]
            }
          });
        } else {
          bot.sendMessage(chatId, 'К сожалению, приглашение не найдено.');
        }
      }
    });

    bot.onText(/\/start$/, (msg) => {
      bot.sendMessage(msg.chat.id, 'Добро пожаловать в EventPlan! Нажмите кнопку ниже или в меню, чтобы открыть приложение.', {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Открыть EventPlan', web_app: { url: amveraUrl } }
          ]]
        }
      });
    });

    bot.onText(/\/help/, (msg) => {
      const helpText = `🛠 Инструкция по использованию:\n\nОрганизаторам:\nИспользуйте кнопку "Меню" -> "EventPlan" или нажмите /start, чтобы войти в панель управления. Там вы сможете создать событие, добавить гостей и настроить рассадку.\n\nГостям:\nПерейдите по уникальной ссылке-приглашению (или нажмите /start guest_ВАШ_ТОКЕН), чтобы открыть ваш персональный билет, где вы сможете подтвердить участие и узнать детали.`;
      bot.sendMessage(msg.chat.id, helpText);
    });

    bot.onText(/\/start$/, (msg) => {
      bot.sendMessage(msg.chat.id, 'Добро пожаловать в EventPlan! Нажмите кнопку ниже или в меню, чтобы открыть приложение.', {
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Открыть EventPlan',
              web_app: { url: amveraUrl }
            }
          ]]
        }
      });
    });
  } catch (err) {
    console.error('Error starting bot:', err);
  }
})();

// API Routes
app.get('/api/events', async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT data FROM events');
  res.json(rows.map(r => JSON.parse(r.data)));
});

app.post('/api/events', requireAuth, async (req, res) => {
  const db = await getDb();
  const event = req.body;
  
  const existing = await db.get('SELECT id FROM events WHERE id = ?', [event.id]);
  if (existing) {
    await db.run('UPDATE events SET data = ? WHERE id = ?', [JSON.stringify(event), event.id]);
  } else {
    await db.run('INSERT INTO events (id, data) VALUES (?, ?)', [event.id, JSON.stringify(event)]);
  }
  res.json({ success: true });
});

app.get('/api/guests', requireAuth, async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT data FROM guests');
  res.json(rows.map(r => JSON.parse(r.data)));
});

app.get('/api/guest/:token', async (req, res) => {
  const db = await getDb();
  const token = req.params.token;
  const row = await db.get('SELECT data FROM guests WHERE data LIKE ?', [`%"token":"${token}"%`]);
  if (row) {
    const guestData = JSON.parse(row.data);
    let tableData = null;
    if (guestData.tableId) {
      const tableRow = await db.get('SELECT data FROM tables WHERE id = ?', [guestData.tableId]);
      if (tableRow) tableData = JSON.parse(tableRow.data);
    }
    res.json({ success: true, guest: guestData, table: tableData });
  } else {
    res.json({ success: false, error: 'Guest not found' });
  }
});

app.post('/api/guest/:token/rsvp', async (req, res) => {
  const db = await getDb();
  const token = req.params.token;
  const { status, companions } = req.body;
  const row = await db.get('SELECT id, data FROM guests WHERE data LIKE ?', [`%"token":"${token}"%`]);
  
  if (row) {
    const guestData = JSON.parse(row.data);
    const oldStatus = guestData.status;
    guestData.status = status;
    guestData.companions = companions;
    await db.run('UPDATE guests SET data = ? WHERE id = ?', [JSON.stringify(guestData), row.id]);
    
    // Notify Organizer if status changed to agree or disagree
    if (oldStatus !== status && (status === 'agree' || status === 'disagree')) {
      const adminUsersRow = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_users']);
      const adminUsers = adminUsersRow ? JSON.parse(adminUsersRow.value) : [];
      
      let notificationText = '';
      if (status === 'agree') {
        let extraCount = companions ? companions.length : 0;
        let extraStr = extraCount > 0 ? ` (+${extraCount} гостя)` : '';
        notificationText = `✅ ${guestData.firstName} ${guestData.lastName} подтвердил участие${extraStr}`;
      } else {
        notificationText = `❌ ${guestData.firstName} ${guestData.lastName} не сможет прийти`;
      }

      for (const adminId of adminUsers) {
        try {
          await bot.sendMessage(adminId, notificationText);
        } catch (e) {
          console.error(`Failed to notify admin ${adminId}:`, e.message);
        }
      }
    }

    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Guest not found' });
  }
});

app.post('/api/guests', requireAuth, async (req, res) => {
  const db = await getDb();
  const guests = req.body; // Expecting array
  
  for (const guest of guests) {
    const existing = await db.get('SELECT id FROM guests WHERE id = ?', [guest.id]);
    if (existing) {
      await db.run('UPDATE guests SET data = ? WHERE id = ?', [JSON.stringify(guest), guest.id]);
    } else {
      await db.run('INSERT INTO guests (id, data) VALUES (?, ?)', [guest.id, JSON.stringify(guest)]);
    }
  }
  res.json({ success: true });
});

app.get('/api/tables', requireAuth, async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT data FROM tables');
  res.json(rows.map(r => JSON.parse(r.data)));
});

app.post('/api/tables', requireAuth, async (req, res) => {
  const db = await getDb();
  const tables = req.body; // Expecting array
  
  for (const table of tables) {
    const existing = await db.get('SELECT id FROM tables WHERE id = ?', [table.id]);
    if (existing) {
      await db.run('UPDATE tables SET data = ? WHERE id = ?', [JSON.stringify(table), table.id]);
    } else {
      await db.run('INSERT INTO tables (id, data) VALUES (?, ?)', [table.id, JSON.stringify(table)]);
    }
  }
  res.json({ success: true });
});

app.post('/api/reminders', requireAuth, async (req, res) => {
  try {
    const { templates } = req.body;
    const db = await getDb();
    
    // Fetch all guests with telegram_id
    const rows = await db.all('SELECT data, telegram_id FROM guests WHERE telegram_id IS NOT NULL');
    
    let sentCount = 0;
    for (const row of rows) {
      if (!row.telegram_id) continue;
      const guest = JSON.parse(row.data);
      
      let messageText = `Здравствуйте, ${guest.firstName}! Напоминание о предстоящем событии.`;
      
      if (templates.includes('7d') && guest.status === 'invited') {
        messageText = `Здравствуйте, ${guest.firstName}! Пожалуйста, подтвердите ваше присутствие на нашем мероприятии!`;
      } else if (templates.includes('1d') && guest.status === 'agree') {
        messageText = `Здравствуйте, ${guest.firstName}! Напоминаем, что наше мероприятие уже завтра! Ждем вас!`;
      } else if (templates.includes('3d') && guest.status === 'agree') {
        messageText = `Здравствуйте, ${guest.firstName}! Напоминаем про дресс-код на наше мероприятие через 3 дня!`;
      } else {
        continue; // Skip if no matching template for their status
      }
      
      try {
        await bot.sendMessage(row.telegram_id, messageText, {
          reply_markup: {
            inline_keyboard: [[
              { text: 'Открыть EventPlan', web_app: { url: amveraUrl } }
            ]]
          }
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${row.telegram_id}:`, err.message);
      }
    }
    
    res.json({ success: true, message: `Успешно отправлено ${sentCount} сообщений!` });
  } catch (err) {
    console.error('Error sending reminders:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { password, telegramInitData } = req.body;
  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_password']);
  if (row && row.value === password) {
    let telegramId = null;
    if (telegramInitData && verifyTelegramWebAppData(telegramInitData)) {
      telegramId = parseTelegramId(telegramInitData);
      if (telegramId) {
        let adminUsersRow = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_users']);
        let adminUsers = adminUsersRow ? JSON.parse(adminUsersRow.value) : [];
        if (!adminUsers.includes(telegramId)) {
          adminUsers.push(telegramId);
          if (adminUsersRow) {
            await db.run('UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(adminUsers), 'admin_users']);
          } else {
            await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['admin_users', JSON.stringify(adminUsers)]);
          }
        }
      }
    }
    const token = jwt.sign({ admin: true, telegramId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token });
  } else {
    res.json({ success: false, error: 'Неверный пароль' });
  }
});

app.post('/api/auth/check', async (req, res) => {
  const { telegramInitData } = req.body;
  if (!telegramInitData || !verifyTelegramWebAppData(telegramInitData)) {
    return res.json({ success: false });
  }

  const telegramId = parseTelegramId(telegramInitData);
  if (!telegramId) return res.json({ success: false });

  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_users']);
  const adminUsers = row ? JSON.parse(row.value) : [];
  if (adminUsers.includes(telegramId)) {
    const token = jwt.sign({ admin: true, telegramId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token });
  } else {
    res.json({ success: false });
  }
});

app.post('/api/auth/generate-invite', requireAuth, async (req, res) => {
  const db = await getDb();
  const inviteToken = 'adm_' + Math.random().toString(36).substr(2, 9);
  await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [`invite_${inviteToken}`, Date.now().toString()]);
  res.json({ success: true, token: inviteToken });
});

app.post('/api/auth/join', async (req, res) => {
  const { token, telegramInitData } = req.body;
  
  if (!telegramInitData || !verifyTelegramWebAppData(telegramInitData)) {
    return res.json({ success: false, error: 'Invalid Telegram Data' });
  }
  
  const telegramId = parseTelegramId(telegramInitData);
  if (!telegramId) return res.json({ success: false, error: 'Cannot find Telegram ID' });

  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', [`invite_${token}`]);
  if (row) {
    // Valid invite token
    let adminUsersRow = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_users']);
    let adminUsers = adminUsersRow ? JSON.parse(adminUsersRow.value) : [];
    if (!adminUsers.includes(telegramId)) {
      adminUsers.push(telegramId);
      if (adminUsersRow) {
        await db.run('UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(adminUsers), 'admin_users']);
      } else {
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['admin_users', JSON.stringify(adminUsers)]);
      }
    }
    const jwtToken = jwt.sign({ admin: true, telegramId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token: jwtToken });
  } else {
    res.json({ success: false, error: 'Неверный или просроченный инвайт' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_password']);
  if (row && row.value === oldPassword) {
    await db.run('UPDATE settings SET value = ? WHERE key = ?', [newPassword, 'admin_password']);
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Текущий пароль неверен' });
  }
});


app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Auto Reminders Service (APScheduler equivalent)
let lastSentDates = { '7d': '', '3d': '', '1d': '' };

setInterval(async () => {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const todayStr = now.toISOString().split('T')[0];

    // Check every 30 mins: 12:00 for 7d and 3d, 10:00 for 1d
    const is12 = hours === 12 && minutes < 30;
    const is10 = hours === 10 && minutes < 30;
    
    if (!is12 && !is10) return;

    const db = await getDb();
    const eventRow = await db.get('SELECT data FROM events LIMIT 1');
    if (!eventRow) return;
    const event = JSON.parse(eventRow.data);
    if (!event.date) return;
    
    const daysUntil = Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 3600 * 24));
    
    const formatDate = (dateString) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    let activeTemplate = null;
    if (daysUntil === 7 && is12 && lastSentDates['7d'] !== todayStr) activeTemplate = '7d';
    if (daysUntil === 3 && is12 && lastSentDates['3d'] !== todayStr) activeTemplate = '3d';
    if (daysUntil === 1 && is10 && lastSentDates['1d'] !== todayStr) activeTemplate = '1d';

    if (activeTemplate) {
      const rows = await db.all('SELECT data, telegram_id FROM guests WHERE telegram_id IS NOT NULL');
      
      const adminUsersRow = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_users']);
      const adminUsers = adminUsersRow ? JSON.parse(adminUsersRow.value) : [];

      for (const row of rows) {
        if (!row.telegram_id) continue;
        const guest = JSON.parse(row.data);
        
        // Fetch table info if available
        let tableStr = '';
        if (guest.tableId) {
          const tableRow = await db.get('SELECT data FROM tables WHERE id = ?', [guest.tableId]);
          if (tableRow) {
            const table = JSON.parse(tableRow.data);
            if (activeTemplate === '3d') {
              tableStr = `\n🪑 Ваш стол: ${table.name}  |  Место: ${guest.seatIndex !== undefined ? guest.seatIndex + 1 : '?'} из ${table.capacity}`;
            } else if (activeTemplate === '1d') {
              tableStr = `\n🪑 Ваш стол: ${table.name}`;
            }
          }
        }

        let messageText = '';
        if (activeTemplate === '7d' && ['invited', 'prepared', 'delivered'].includes(guest.status)) {
          messageText = `📢 Напоминаем! До мероприятия «${event.title}» осталось 7 дней.\nВы ещё не подтвердили участие.\n📅 ${formatDate(event.date)}  📍 ${event.address}`;
        } else if (activeTemplate === '3d' && guest.status === 'agree') {
          messageText = `⏰ До «${event.title}» осталось 3 дня!\n📅 ${formatDate(event.date)}\n📍 ${event.address}${tableStr}`;
        } else if (activeTemplate === '1d' && guest.status === 'agree') {
          messageText = `🔔 Завтра — «${event.title}»!\n📅 ${formatDate(event.date)}\n📍 ${event.address}${tableStr}`;
        }

        if (messageText) {
          try {
            await bot.sendMessage(row.telegram_id, messageText, {
              reply_markup: activeTemplate !== '1d' ? {
                inline_keyboard: [[
                  { text: 'Открыть приглашение', web_app: { url: `${amveraUrl}/#/invite/${guest.token}` } }
                ]]
              } : undefined
            });
          } catch(e) {
            console.error(e);
          }
        }
      }
      
      // For 3 days, notify organizers too (as per TZ)
      if (activeTemplate === '3d') {
        for (const adminId of adminUsers) {
          try {
            await bot.sendMessage(adminId, `⏰ До «${event.title}» осталось 3 дня! Рассылка подтвердившим гостям отправлена.`);
          } catch(e) {}
        }
      }

      lastSentDates[activeTemplate] = todayStr;
    }
  } catch (err) {
    console.error('Auto reminder error:', err);
  }
}, 30 * 60 * 1000); // Check every 30 mins


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
