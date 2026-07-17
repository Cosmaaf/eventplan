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
      const guestToken = match[1];

      const db = await getDb();
      const row = await db.get('SELECT id, data FROM guests WHERE data LIKE ?', [`%"token":"${guestToken}"%`]);

      if (row) {
        const guestData = JSON.parse(row.data);
        
        // Save telegram ID
        await db.run('UPDATE guests SET telegram_id = ? WHERE id = ?', [chatId.toString(), row.id]);

        bot.sendMessage(chatId, `Здравствуйте, ${guestData.firstName}! Вы приглашены на свадьбу! Нажмите кнопку ниже, чтобы открыть ваш персональный пригласительный.`, {
          reply_markup: {
            inline_keyboard: [[
              {
                text: 'Открыть пригласительный',
                web_app: { url: amveraUrl } // In a real app we'd pass token or ID, but local storage handles session or we can pass url?token=..
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


app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
