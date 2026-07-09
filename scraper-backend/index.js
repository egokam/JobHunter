const express = require('express');
const cors = require('cors');
const { runScraper } = require('./scraper');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/scrape', async (req, res) => {
  try {
    const settings = req.body;
    const result = await runScraper(settings);
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/publish', async (req, res) => {
  try {
    // 1. استخراج المتغيرات الجديدة من الطلب القادم من الفرونت-إند
    const { title, company, location, url, source, work_type, salary } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const sourceIcon = source === 'LinkedIn' ? '🟦' : '🟩';
    
    // دالة لتنظيف النصوص وتجنب أخطاء Telegram HTML Parser
    const escapeHtml = (text) => text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    const safeTitle = escapeHtml(title);
    const safeCompany = escapeHtml(company);
    const safeLocation = escapeHtml(location);
    const safeWorkType = escapeHtml(work_type);
    const safeSalary = escapeHtml(salary);

    // 2. بناء نص الرسالة ديناميكياً بناءً على توفر البيانات
    let message = `🚀 <b>${safeTitle}</b>\n\n`;
    message += `🏢 <b>Company:</b> <code>${safeCompany}</code>\n`;
    message += `📍 <b>Location:</b> <i>${safeLocation}</i>\n`;
    
    // إذا كان نوع العمل متوفراً (Remote / Hybrid / On-site) قم بإضافته
    if (safeWorkType) {
      message += `💼 <b>Work Type:</b> <code>${safeWorkType}</code>\n`;
    }
    
    // إذا كان الراتب مذكوراً ومتوفراً قم بإضافته
    if (safeSalary) {
      message += `💰 <b>Salary:</b> <code>${safeSalary}</code>\n`;
    }
    
    message += `${sourceIcon} <b>Platform:</b> #${source}\n\n`;
    message += `⚡ <i>Hunted by JobHunter Engine</i>`;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.trim(),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Apply Now 💼", url: url }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    if (data.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, error: data.description });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});