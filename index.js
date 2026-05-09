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

// استدعاء ملفات الإعدادات والمعالج من مجلد commands الصغير
const settings = require("./settings");
const { handleMessages, smsg } = require("./commands/handler");

// إعداد Gemini باستخدام المفتاح من الـ Secrets مباشرة
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startSaeedBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: true,
      browser: Browsers.macOS("Desktop"),
      auth: state,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek?.message || mek.key.fromMe) return;

        // تحويل الرسالة لصيغة مفهومة للمعالج
        const m = smsg(sock, mek);
        const text = (m.body || "").trim();
        const from = m.from;

        // --- ميزة الذكاء الاصطناعي Gemini ---
        const isAI = settings.aiTrigger.some(t => text.toLowerCase().startsWith(t.toLowerCase()));
        if (isAI && settings.aiEnabled) {
          const prompt = text.replace(/بوت|سعيد|saeed/gi, "").trim();
          if (prompt) {
            const result = await aiModel.generateContent(prompt);
            const response = await result.response;
            return await sock.sendMessage(from, { text: response.text() });
          }
        }

        // --- تشغيل أوامر السورس الأصلية ---
        await handleMessages(sock, chatUpdate);

      } catch (err) {
        console.log(chalk.red("خطأ في معالجة الرسالة:"), err.message);
      }
    });

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        console.log(chalk.green("\n✅ تم الاتصال بنجاح! بوت سعيد الضحباني جاهز الآن.\n"));
      }
      if (connection === "close") {
        const shouldReconnect = (new Boom(lastDisconnect?.error)?.output?.statusCode) !== DisconnectReason.loggedOut;
        if (shouldReconnect) startSaeedBot();
      }
    });

  } catch (err) {
    console.error(chalk.red("خطأ في بدء البوت:"), err.message);
    setTimeout(startSaeedBot, 5000);
  }
}

startSaeedBot();
