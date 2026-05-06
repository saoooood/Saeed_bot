// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك: 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');
const readline = require('readline');

const settings = require('./settings');
const { handleMessages } = require('./commands/handler');
const { handleGroupUpdate } = require('./commands/group_events');

// ===== إدخال رقم الهاتف =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// ===== تخزين الرسائل =====
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

// ===== معالجة الأخطاء =====
process.on('unhandledRejection', err => console.error(chalk.red('خطأ غير متوقع:'), err?.message || err));
process.on('uncaughtException', err => console.error(chalk.red('خطأ خطير:'), err?.message || err));

// ===== بدء البوت مع الربط بالرقم =====
async function startBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      browser: ['سعيد بوت 🛡️', 'Chrome', '120.0.0'],
      auth: state,
      printQRInTerminal: false,  // إيقاف QR Code
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
    });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    // ===== طلب رقم الهاتف للربط =====
    if (!sock.authState.creds.registered) {
      console.log(chalk.cyan('\n🛡️ مرحباً بك في سعيد بوت\n'));
      const phoneNumber = await question(chalk.yellow('📱 أدخل رقم هاتفك بالصيغة الدولية (مثال: 967770179625): '));
      rl.close();
      
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
      console.log(chalk.green(`✅ جاري إرسال رمز الاقتران للرقم: ${formattedNumber}`));
      
      setTimeout(async () => {
        const code = await sock.requestPairingCode(formattedNumber);
        console.log(chalk.magenta(`\n🔐 رمز الاقتران الخاص بك: ${code}\n`));
        console.log(chalk.cyan('افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز ← أدخل الرمز'));
      }, 1000);
    }

    // ===== رفض المكالمات =====
    sock.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status === 'offer' && settings.antiCall) {
          try {
            await sock.rejectCall(call.id, call.from);
            await sock.sendMessage(call.from, {
              text: `🚫 *سعيد بوت 🛡️ - ممنوع المكالمات*\n\nيا صاحبي، البوت ما يقبل المكالمات!`
            });
            console.log(chalk.yellow('📵 تم رفض مكالمة من:', call.from));
          } catch (e) {}
        }
      }
    });

    // ===== أحداث المجموعات =====
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
        const sender = mek.key.participant || mek.key.remoteJid;
        if (isSpam(sender)) return;
        await handleMessages(sock, chatUpdate, store);
      } catch (err) { console.error('Messages upsert error:', err.message); }
    });

    // ===== حالة الاتصال =====
    sock.ev.on('connection.update', async (s) => {
      const { connection, lastDisconnect } = s;
      if (connection === 'open') {
        console.log(chalk.green('\n✅ سعيد بوت 🛡️ اشتغل وجاهز! يلا بنا\n'));
      }
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('❌ تم تسجيل الخروج. امسح QR مجدداً.'));
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

console.log(chalk.magenta(`
╔══════════════════════════════════╗
║      𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - جاري التشغيل     ║
║      الربط عبر رقم الهاتف          ║
║      المطور: +967 770 179 625     ║
╚══════════════════════════════════╝
`));

startBot();
