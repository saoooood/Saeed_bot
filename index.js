// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const chalk = require("chalk");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const settings = require("./settings");
const handler = require("./commands/handler");

async function startSaeedBot() {
  // استخدام مجلد جديد تماماً لضمان عدم حدوث الخطأ 440
  const { state, saveCreds } = await useMultiFileAuthState("./new_saeed_session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: Browsers.ubuntu("Chrome"), // تغيير المتصفح يساعد في استقرار الربط
    syncFullHistory: false
  });

  // --- طلب كود الربط لرقمك يا سعيد ---
  if (!sock.authState.creds.registered) {
    const myNumber = "967770179625"; // رقمك المسجل
    
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(myNumber);
        console.log(chalk.black.bgGreen(`\n كود الربط الجديد هو: ${code} \n`));
        console.log(chalk.white("ادخله في واتساب > الأجهزة المرتبطة > الربط برقم الهاتف."));
      } catch (err) {
        console.log(chalk.red("تعذر طلب الكود، أعد تشغيل البوت: "), err.message);
      }
    }, 5000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log(chalk.green("\n✅ مبروك يا سعيد! تم الاتصال بنجاح والبوت مستقر الآن.\n"));
    }
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      // إذا استمر الخطأ 440، سيقوم الكود بإعادة المحاولة تلقائياً
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(startSaeedBot, 5000);
      }
    }
  });

  sock.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek?.message || mek.key.fromMe) return;
      if (typeof handler === 'function') await handler(sock, mek, chatUpdate);
    } catch (e) { console.log(e); }
  });
}

startSaeedBot();
