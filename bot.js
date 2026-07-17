import TelegramBot from 'node-telegram-bot-api';

const token = '8286647302:AAFIUaqwwWT5EntLcr1fwJy9EQCIwz0I4GM';
const bot = new TelegramBot(token, { polling: true });
const url = 'https://61354a3d46ad6f.lhr.life';

(async () => {
  try {
    // Set menu button
    await bot.setChatMenuButton({
      menu_button: JSON.stringify({
        type: 'web_app',
        text: 'EventPlan',
        web_app: { url: url }
      })
    });
    console.log('Menu button set successfully to:', url);

    bot.onText(/\/start/, (msg) => {
      bot.sendMessage(msg.chat.id, 'Добро пожаловать в EventPlan! Нажмите кнопку ниже или в меню, чтобы открыть приложение.', {
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Открыть EventPlan',
              web_app: { url: url }
            }
          ]]
        }
      });
    });

  } catch (err) {
    console.error('Error:', err);
  }
})();
