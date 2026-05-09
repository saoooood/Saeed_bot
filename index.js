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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

async function startSaeedBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    // استخدام اسم مجلد جديد لضمان بداية نظيفة
    const { state, saveCreds } = await useMultiFileAuthState("./saeed_v3_auth");

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Desktop"), // استخدام متصفح ثابت
      auth: state,
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(chalk.magenta("📸 كود QR متاح الآن، يرجى مسحه للربط."));
      }

      if (connection === "open") {
        console.log(chalk.green("\n✅ تم الاتصال بنجاح! بوت سعيد الذبحاني جاهز للعمل.\n"));
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(chalk.red(`🔄 انقطع الاتصال (الرمز: ${reason}). جاري المحاولة بعد قليل...`));

        if (reason !== DisconnectReason.loggedOut) {
          setTimeout(startSaeedBot, 5000);
        } else {
          console.log(chalk.bgRed("❌ تم تسجيل الخروج، يرجى إعادة الربط بالـ QR."));
        }
      }
    });

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
          try {
            const result = await aiModel.generateContent(text.replace(/بوت|سعيد/gi, "").trim());
            return await sock.sendMessage(from, { text: result.response.text() });
          } catch (e) {
            console.log(chalk.red("AI Error:"), e.message);
          }
        }

        if (typeof handler === 'function') await handler(sock, mek, chatUpdate);
      } catch (err) {
        if (!err.message.includes("Bad MAC")) console.log(err);
      }
    });

  } catch (err) {
    setTimeout(startSaeedBot, 10000);
  }
}

startSaeedBot();

