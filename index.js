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

// استخدام الموديل gemini-1.5-flash مع نظام معالجة أخطاء
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
      // تحسين استقرار الاتصال لتجنب Connection Closed
      defaultQueryTimeoutMs: undefined,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek?.message || mek.key.fromMe) return;

        const from = mek.key.remoteJid;
        const text = mek.message.conversation || 
                     mek.message.extendedTextMessage?.text || 
                     mek.message.imageMessage?.caption || "";

        const isAI = settings.aiTrigger.some(t => text.toLowerCase().startsWith(t.toLowerCase()));
        
        if (isAI && settings.aiEnabled) {
          const prompt = text.replace(/بوت|سعيد|saeed/gi, "").trim();
          if (prompt) {
            try {
                // محاولة جلب الرد من Gemini
                const result = await aiModel.generateContent(prompt);
                const response = result.response;
                await sock.sendMessage(from, { text: response.text() });
            } catch (aiErr) {
                console.log(chalk.red("Gemini Error:"), aiErr.message);
                // رد احتياطي في حال فشل Gemini
                await sock.sendMessage(from, { text: " ⚠️ يا حيدي، به نثره في خوادم الذكاء الاصطناعي نبسر ماهو الخبر وبعدا عد انبيكم." });
            }
            return; // إنهاء المعالجة هنا لكي لا يتداخل مع الأوامر الأخرى
          }
        }

        // تشغيل أوامر السورس الأصلية
        if (typeof handler === 'function') {
            await handler(sock, mek, chatUpdate);
        } else if (handler.handleMessages) {
            await handler.handleMessages(sock, chatUpdate);
        }

      } catch (err) {
        console.log(chalk.red("خطأ في المعالجة:"), err.message);
      }
    });

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        console.log(chalk.green("\n✅ تم الاتصال بنجاح! بوت سعيد الذبحاني جاهز.\n"));
      }
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(chalk.yellow(`🔄 انقطع الاتصال بسبب: ${reason}. جاري إعادة التشغيل...`));
        if (reason !== DisconnectReason.loggedOut) startSaeedBot();
      }
    });

  } catch (err) {
    console.error(chalk.red("خطأ في بدء البوت:"), err.message);
    setTimeout(startSaeedBot, 10000); // زيادة مدة الانتظار قبل إعادة المحاولة
  }
}

startSaeedBot();
