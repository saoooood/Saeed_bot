// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك: 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: require('pino')({ level: 'silent' }),
    browser: ['سعيد بوت', 'Chrome', '120.0.0'],
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    console.log(chalk.cyan('\n📱 رقمك الدولي (مثال: 967770179625):'));
    const phoneNumber = await question('967770179625');
    const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
    console.log(chalk.green(`✅ جاري إرسال الرمز إلى ${formattedNumber}`));
    const code = await sock.requestPairingCode(formattedNumber);
    console.log(chalk.magenta(`\n🔐 رمز الاقتران: ${code}\n`));
    console.log(chalk.cyan('افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز ← أدخل الرمز'));
    rl.close();
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log(chalk.green('\n✅ سعيد بوت اشتغل وجاهز!\n'));
    }
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) process.exit(0);
      else startBot();
    }
  });
}

startBot();
