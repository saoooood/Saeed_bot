// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================


require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const readline = require('readline');

// للاستخدام في GitHub Actions
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['سعيد بوت', 'Chrome', '120.0.0'],
    logger: require('pino')({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    console.log('\n📱 رقمك الدولي (بدون + أو أصفار):');
    console.log('مثال: 967770179625\n');
    const phoneNumber = await question('الرقم: ');
    const formatted = phoneNumber.replace(/[^0-9]/g, '967770179625');
    console.log(`\n✅ جاري إرسال الرمز إلى ${formatted}...`);
    
    const code = await sock.requestPairingCode(formatted);
    console.log(`\n🔐 رمز الاقتران: ${code}\n`);
    console.log('افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز وأدخل هذا الرمز');
    rl.close();
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('\n✅ سعيد بوت اشتغل وجاهز!\n');
    }
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) process.exit(0);
      else startBot();
    }
  });
}

startBot();
