import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(express.json());

const token = '8286647302:AAFIUaqwwWT5EntLcr1fwJy9EQCIwz0I4GM';
const amveraUrl = 'https://qwqwe-ilya12321dq.waw0.amvera.tech'; // Amvera URL

const bot = new TelegramBot(token, { polling: true });
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

    bot.onText(/\/start (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const startParam = match[1];

      if (startParam.startsWith('admin_invite_')) {
        const token = startParam.replace('admin_invite_', '');
        bot.sendMessage(chatId, 'Вы приглашены стать со-организатором! Нажмите кнопку ниже, чтобы принять приглашение.', {
          reply_markup: {
            inline_keyboard: [[
              {
                text: 'Принять приглашение',
                web_app: { url: `${amveraUrl}?admin_invite=${token}` } 
              }
            ]]
          }
        });
        return;
      }

      const db = await getDb();
      const row = await db.get('SELECT id, data FROM guests WHERE data LIKE ?', [`%"token":"${startParam}"%`]);

      if (row) {
        const guestData = JSON.parse(row.data);
        
        // Save telegram ID
        await db.run('UPDATE guests SET telegram_id = ? WHERE id = ?', [chatId.toString(), row.id]);

        bot.sendMessage(chatId, `Здравствуйте, ${guestData.firstName}! Вы приглашены на свадьбу! Нажмите кнопку ниже, чтобы открыть ваш персональный пригласительный.`, {
          reply_markup: {
            inline_keyboard: [[
              {
                text: 'Открыть пригласительный',
                web_app: { url: `${amveraUrl}?token=${guestToken}` } 
              }
            ]]
          }
        });
      } else {
        bot.sendMessage(chatId, 'К сожалению, приглашение не найдено.');
      }
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

app.post('/api/events', async (req, res) => {
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

app.get('/api/guests', async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT data FROM guests');
  res.json(rows.map(r => JSON.parse(r.data)));
});

app.post('/api/guests', async (req, res) => {
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

app.get('/api/tables', async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT data FROM tables');
  res.json(rows.map(r => JSON.parse(r.data)));
});

app.post('/api/tables', async (req, res) => {
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

app.post('/api/reminders', async (req, res) => {
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
  const { password, telegramId } = req.body;
  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_password']);
  if (row && row.value === password) {
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
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Неверный пароль' });
  }
});

app.post('/api/auth/check', async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.json({ success: false });

  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_users']);
  const adminUsers = row ? JSON.parse(row.value) : [];
  if (adminUsers.includes(telegramId)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post('/api/auth/generate-invite', async (req, res) => {
  const db = await getDb();
  const inviteToken = 'adm_' + Math.random().toString(36).substr(2, 9);
  await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [`invite_${inviteToken}`, Date.now().toString()]);
  res.json({ success: true, token: inviteToken });
});

app.post('/api/auth/join', async (req, res) => {
  const { token, telegramId } = req.body;
  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', [`invite_${token}`]);
  if (row) {
    // Valid invite token
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
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Неверный или просроченный инвайт' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
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

// Auto Reminders Service
let lastSentDate = '';

setInterval(async () => {
  try {
    const now = new Date();
    // Run at 10 AM UTC (or local time depending on server)
    if (now.getHours() === 10) {
      const todayStr = now.toISOString().split('T')[0];
      if (lastSentDate === todayStr) return; // Already sent today
      
      const db = await getDb();
      // Fetch event data to know the event date
      const eventRow = await db.get('SELECT data FROM events LIMIT 1');
      if (!eventRow) return;
      const event = JSON.parse(eventRow.data);
      if (!event.date) return;
      
      const daysUntil = Math.max(0, Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 3600 * 24)));
      let templates = [];
      
      if (daysUntil === 7) templates.push('7d');
      else if (daysUntil === 3) templates.push('3d');
      else if (daysUntil === 1) templates.push('1d');
      
      if (templates.length > 0) {
        // We can reuse the reminder logic
        const rows = await db.all('SELECT data, telegram_id FROM guests WHERE telegram_id IS NOT NULL');
        
        for (const row of rows) {
          if (!row.telegram_id) continue;
          const guest = JSON.parse(row.data);
          let messageText = '';
          
          if (templates.includes('7d') && guest.status === 'invited') {
            messageText = `Здравствуйте, ${guest.firstName}! Пожалуйста, подтвердите ваше присутствие на нашем мероприятии!`;
          } else if (templates.includes('1d') && guest.status === 'agree') {
            messageText = `Здравствуйте, ${guest.firstName}! Напоминаем, что наше мероприятие уже завтра! Ждем вас!`;
          } else if (templates.includes('3d') && guest.status === 'agree') {
            messageText = `Здравствуйте, ${guest.firstName}! Напоминаем про дресс-код на наше мероприятие через 3 дня!`;
          }
          
          if (messageText) {
            try {
              await bot.sendMessage(row.telegram_id, messageText, {
                reply_markup: {
                  inline_keyboard: [[
                    { text: 'Открыть EventPlan', web_app: { url: `${amveraUrl}?token=${guest.token}` } }
                  ]]
                }
              });
            } catch(e) {
              console.error(e);
            }
          }
        }
        lastSentDate = todayStr;
      }
    }
  } catch (err) {
    console.error('Auto reminder error:', err);
  }
}, 60 * 60 * 1000); // Check every hour


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
