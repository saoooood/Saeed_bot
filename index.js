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
  _data: { messages: {} },
  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      for (const m of messages) {
        if (!m.key?.remoteJid) continue;
        const jid = jidNormalizedUser(m.key.remoteJid);
        if (!this._data.messages[jid]) this._data.messages[jid] = {};
        this._data.messages[jid][m.key.id] = m;
      }
    });
  },
  loadMessage: function(jid, id) {
    return this._data.messages[jid]?.[id] || null;
  }
};

// ===== نظام مكافحة السبام =====
const spamDB = new Map();
function isSpam(jid) {
  const now = Date.now();
  const d = spamDB.get(jid) || { count: 0, last: now, muteUntil: 0 };
  if (d.muteUntil > now) return true;
  if (now - d.last > settings.spamTimeWindow) { d.count = 1; d.last = now; }
  else d.count++;
  if (d.count > settings.spamMsgLimit) { 
    d.muteUntil = now + settings.spamCooldown; 
    spamDB.set(jid, d); 
    return true; 
  }
  spamDB.set(jid, d);
  return false;
}

// ===== بدء تشغيل البوت =====
async function startSaeedBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const msgRetryCounterCache = new NodeCache();

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      browser: Browsers.macOS('Desktop'),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
      },
      msgRetryCounterCache,
      syncFullHistory: false
    });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    // معالجة الرسائل والذكاء الاصطناعي
    sock.ev.on('messages.upsert', async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek?.message || mek.key.fromMe) return;
        
        // تنظيف الرسالة وتحويلها لصيغة الميغو بوت
        const m = smsg(sock, mek);
        const from = m.from;
        const text = (m.body || "").trim();

        if (isSpam(m.sender)) return;

        // --- نظام الذكاء الاصطناعي Gemini ---
        const isAI = settings.aiTrigger.some(t => text.toLowerCase().startsWith(t.toLowerCase()));
        if (isAI && settings.aiEnabled) {
            const prompt = text.replace(/بوت|سعيد|saeed/gi, '').trim();
            if (prompt) {
                const result = await aiModel.generateContent(prompt);
                return await sock.sendMessage(from, { text: result.response.text() });
            }
        }

        // --- تشغيل الأوامر الأصلية (Handler) ---
        await handleMessages(sock, chatUpdate, store);

      } catch (err) { console.error('Error in messages.upsert:', err.message); }
    });

    // حالة الاتصال
    sock.ev.on('connection.update', async (s) => {
      const { connection, lastDisconnect } = s;
      if (connection === 'open') {
        console.log(chalk.green('\n✅ تم تشغيل بوت سعيد الضحباني بنجاح! 🛡️\n'));
        const botNum = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        await sock.sendMessage(botNum, { text: `✅ البوت متصل الآن!\n👤 المطور: سعيد الضحباني\n🤖 الذكاء الاصطناعي: مفعّل` });
      }
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) startSaeedBot();
      }
    });

  } catch (err) {
    console.error('Start Bot Error:', err.message);
    setTimeout(startSaeedBot, 5000);
  }
}

startSaeedBot();
