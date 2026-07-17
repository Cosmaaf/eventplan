import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

const token = '8286647302:AAFIUaqwwWT5EntLcr1fwJy9EQCIwz0I4GM';
const amveraUrl = 'https://ilya12321dq-qwqwe.amvera.io'; // Amvera URL

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

    bot.onText(/\/start/, (msg) => {
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

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
