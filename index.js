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

// إعداد Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startSaeedBot() {
  // استخدام مجلد جديد للجلسة لضمان طلب الكود
  const { state, saveCreds } = await useMultiFileAuthState("./saeed_pairing_session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: Browsers.macOS("Desktop"), 
    syncFullHistory: false
  });

  // --- نظام طلب كود الربط التلقائي لرقمك ---
  if (!sock.authState.creds.registered) {
    const myNumber = "967770179625"; // رقمك يا سعيد
    console.log(chalk.cyan(`\n🚀 جاري طلب كود الربط للرقم: ${myNumber}`));
    
    // تأخير بسيط لضمان جاهزية الاتصال قبل طلب الكود
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(myNumber);
        console.log(chalk.black.bgGreen(`\n كود الربط الخاص بك هو: ${code} \n`));
        console.log(chalk.white("افتح واتساب > الأجهزة المرتبطة > ربط جهاز > الربط برقم الهاتف وأدخل الكود أعلاه."));
      } catch (err) {
        console.log(chalk.red("خطأ في طلب الكود: "), err.message);
      }
    }, 3000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log(chalk.green("\n✅ تم الاتصال بنجاح! بوت سعيد الذبحاني جاهز الآن.\n"));
    }
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(startSaeedBot, 5000);
      }
    }
  });

  sock.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek?.message || mek.key.fromMe) return;
      
      const from = mek.key.remoteJid;
      const text = mek.message.conversation || mek.message.extendedTextMessage?.text || "";

      // استجابة الذكاء الاصطناعي (Gemini)
      const isAI = settings.aiTrigger.some(t => text.toLowerCase().startsWith(t.toLowerCase()));
      if (isAI && settings.aiEnabled) {
         try {
           const result = await aiModel.generateContent(text.replace(/بوت|سعيد/gi, "").trim());
           await sock.sendMessage(from, { text: result.response.text() });
         } catch (e) { console.log(chalk.red("AI Error: "), e.message); }
      }

      if (typeof handler === 'function') await handler(sock, mek, chatUpdate);
    } catch (e) { console.log(e); }
  });
}

startSaeedBot();
