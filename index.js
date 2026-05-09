// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');
const NodeCache = require('node-cache');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');

// استدعاء ملفات الإعدادات والمعالج من المسارات الصحيحة
const settings = require('./settings');
const { handleMessages } = require('./commands/handler'); // تم التأكد من الحرف الصغير
const { smsg } = require('./commands/handler'); 

// إعداد الذكاء الاصطناعي Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ===== تخزين الرسائل مؤقتاً =====
const store = {
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const NodeCache = require('node-cache');
const chalk = require('chalk');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

// استدعاء الملفات من مجلد commands الصغير كما أكدت لي
const settings = require('./settings');
const { handleMessages, smsg } = require('./commands/handler'); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startSaeedBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      browser: Browsers.macOS('Desktop'),
      auth: state,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek?.message || mek.key.fromMe) return;

        // استخدام smsg من داخل مجلد commands
        const m = smsg(sock, mek);
        const text = (m.body || "").trim();

        // تفعيل Gemini
        const isAI = settings.aiTrigger.some(t => text.toLowerCase().startsWith(t.toLowerCase()));
        if (isAI && settings.aiEnabled) {
            const prompt = text.replace(/بوت|سعيد|saeed/gi, '').trim();
            if (prompt) {
                const result = await aiModel.generateContent(prompt);
                return await sock.sendMessage(m.from, { text: result.response.text() });
            }
        }

        // تشغيل أوامر السورس الأصلية
        await handleMessages(sock, chatUpdate);

      } catch (err) { console.log('Error:', err.message); }
    });

    sock.ev.on('connection.update', (s) => {
      const { connection, lastDisconnect } = s;
      if (connection === 'open') console.log(chalk.green('✅ بوت سعيد الضحباني يعمل الآن!'));
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) startSaeedBot();
      }
    });

  } catch (err) {
    console.error('Start Error:', err.message);
    setTimeout(startSaeedBot, 5000);
  }
}

startSaeedBot();
