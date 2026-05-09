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

// استخدام API Key من البيئة المحيطة
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

async function startSaeedBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    // تغيير اسم المجلد لفرض جلسة جديدة ونظيفة
    const { state, saveCreds } = await useMultiFileAuthState("./saeed_auth");

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Desktop"),
      auth: state,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) console.log(chalk.magenta("📸 كود QR جديد متاح في السجلات، يرجى مسحه."));

      if (connection === "open") {
        console.log(chalk.green("\n✅ تم الاتصال! بوت سعيد الذبحاني يعمل الآن بكفاءة.\n"));
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
            console.log(chalk.yellow("🔄 جاري إعادة المحاولة..."));
            setTimeout(startSaeedBot, 5000);
        }
      }
    });

    sock.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        // تجاهل الرسائل التي تفشل في التشفير (Bad MAC) لتجنب الانهيار
        if (!mek?.message || mek.key.fromMe) return;

        const from = mek.key.remoteJid;
        const text = mek.message.conversation || 
                     mek.message.extendedTextMessage?.text || 
                     mek.message.imageMessage?.caption || "";

        const isAI = settings.aiTrigger.some(t => text.toLowerCase().startsWith(t.toLowerCase()));
        if (isAI && settings.aiEnabled) {
          try {
            const result = await aiModel.generateContent(text.replace(/بوت|سعيد/gi, "").trim());
            return await sock.sendMessage(from, { text: result.response.text() });
          } catch (e) {
            console.log(chalk.red("AI Error:"), e.message);
          }
        }

        if (typeof handler === 'function') await handler(sock, mek, chatUpdate);
      } catch (err) {
        // في حال خطأ التشفير، لا نطبع الخطأ كاملاً لتجنب زحمة السجلات
        if (!err.message.includes("Bad MAC")) console.log(err);
      }
    });

  } catch (err) {
    setTimeout(startSaeedBot, 10000);
  }
}

startSaeedBot();
