// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك: 967770179625
// ====================================================

require('dotenv').config();
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');
const readline = require('readline');
const NodeCache = require('node-cache');
const { parsePhoneNumber } = require('libphonenumber-js');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateMessageID,
  downloadContentFromMessage,
  jidDecode,
  proto,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  delay,
  getContentType
} = require('@whiskeysockets/baileys');

const settings = require('./settings');
const { handleMessages } = require('./commands/handler');
const { handleGroupUpdate } = require('./commands/group_events');

// ==== تخزين الرسائل =====
const store = {
  _data: { messages: {} },
  readFromFile() {
    try {
      const p = path.join(__dirname, 'data', 'store.json');
      if (fs.existsSync(p)) {
        this._data = JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) { console.error('Store read error:', e.message); }
  },
  writeToFile() {
    try {
      const dir = path.join(__dirname, 'data');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'store.json'), JSON.stringify(this._data));
    } catch (e) { console.error('Store write error:', e.message); }
  },
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

store.readFromFile();
setInterval(() => store.writeToFile(), 10000);

// ===== مراقبة الذاكرة =====
setInterval(() => {
  const used = process.memoryUsage().rss / 1024 / 1024;
  if (used > 500) {
    console.log(chalk.red('⚠️ الرام عالي مرة (>500MB)، جاري إعادة التشغيل...'));
    process.exit(1);
  }
}, 30000);

// ===== نظام مكافحة السبام =====
const spamDB = new Map();
function isSpam(jid) {
  const now = Date.now();
  const d = spamDB.get(jid) || { count: 0, last: now, muteUntil: 0 };
  if (d.muteUntil > now) return true;
  if (now - d.last > settings.spamTimeWindow) { d.count = 1; d.last = now; }
  else d.count++;
  if (d.count > settings.spamMsgLimit) { d.muteUntil = now + settings.spamCooldown; spamDB.set(jid, d); return true; }
  spamDB.set(jid, d);
  return false;
}

// ===== حماية من الأخطاء =====
process.on('unhandledRejection', err => console.error(chalk.red('خطأ غير متوقع:'), err?.message || err));
process.on('uncaughtException', err => console.error(chalk.red('خطأ خطير:'), err?.message || err));

// ===== بدء البوت =====
async function startBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const msgRetryCounterCache = new NodeCache();

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      browser: ['سعيد بوت 🛡️', 'Chrome', '120.0.0'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        const jid = jidNormalizedUser(key.remoteJid);
        const msg = store.loadMessage(jid, key.id);
        return msg?.message || '';
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000
    });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    // ===== رفض المكالمات وطرد المتصل =====
    sock.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status === 'offer' && settings.antiCall) {
          try {
            await sock.rejectCall(call.id, call.from);
            await sock.sendMessage(call.from, {
              text: `🚫 *سعيد بوت 🛡️ - ممنوع المكالمات*\n\nيا صاحبي، البوت ما يقبل المكالمات!\nاذا كنت بمجموعة وكاليت، حتطرد مع السلامة.`
            });
            console.log(chalk.yellow('📵 تم رفض مكالمة من:', call.from));
          } catch (e) { console.error('Call reject error:', e.message); }
        }
      }
    });

    // ===== أحداث المجموعات (ترحيب / توديع) =====
    sock.ev.on('group-participants.update', async (update) => {
      try { await handleGroupUpdate(sock, update); }
      catch (err) { console.error('Group update error:', err.message); }
    });

    // ===== معالجة الرسائل =====
    sock.ev.on('messages.upsert', async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek?.message) return;
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
          ? mek.message.ephemeralMessage.message
          : mek.message;

        if (mek.key?.remoteJid === 'status@broadcast') return;
        if (mek.key?.id?.startsWith('BAE5') && mek.key.id.length === 16) return;

        const sender = mek.key.participant || mek.key.remoteJid;
        if (isSpam(sender)) return;

        await handleMessages(sock, chatUpdate, store);
      } catch (err) { console.error('Messages upsert error:', err.message); }
    });

    // ===== حالة الاتصال =====
    sock.ev.on('connection.update', async (s) => {
      const { connection, lastDisconnect, qr } = s;
      if (qr) console.log(chalk.cyan('\n📱 امسح QR بكود واتساب...\n'));
      if (connection === 'connecting') console.log(chalk.yellow('🔄 جاري الاتصال بالواتساب...'));
      if (connection === 'open') {
        console.log(chalk.green('\n✅ سعيد بوت 🛡️ اشتغل وجاهز! يلا بنا\n'));
        const botNum = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        await sock.sendMessage(botNum, {
          text: `╔══════════════════════╗\n║   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ v3.0.0   ║\n╚══════════════════════╝\n\n✅ البوت شغال تمام!\n📦 الإصدار: v3.0.0\n⏰ الوقت: ${new Date().toLocaleString('ar-YE')}\n🚀 الأوامر: 600+ أمر\n🤖 الذكاء الاصطناعي: مفعل\n🛡️ الحماية: مفعلة\n\n👑 المالك: +967 770 179 625\n👨‍💻 المطور: +967 770 179 625`
        });
      }
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('❌ تم تسجيل الخروج. امسح QR مرة ثانية.'));
          process.exit(0);
        } else {
          console.log(chalk.yellow('🔁 جاري إعادة الاتصال...'));
          startBot();
        }
      }
    });

    sock.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
      }
      return jid;
    };

    return sock;
  } catch (err) {
    console.error(chalk.red('خطأ في تشغيل البوت:'), err.message);
    setTimeout(startBot, 5000);
  }
}

// ===== تشغيل البوت =====
console.log(chalk.magenta(`
╔══════════════════════════════════╗
║      𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - جاري التشغيل     ║
║         بوت واتساب يمني          ║
║      المطور: +967 770 179 625    ║
╚══════════════════════════════════╝
`));

startBot();
