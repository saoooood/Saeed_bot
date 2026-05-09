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

// إعداد الذكاء الاصطناعي (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

async function startSaeedBot() {
  // الكود سيقرأ الجلسة من مجلد اسمه session
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // تم إيقافه لأنك تملك جلسة جاهزة
    auth: state,
    browser: Browsers.macOS("Desktop"),
    syncFullHistory: false
  });

  // حفظ التحديثات في الجلسة تلقائياً
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "open") {
      console.log(chalk.green("\n✅ تم الاتصال بنجاح باستخدام الجلسة الجاهزة!"));
      console.log(chalk.cyan("🚀 بوت سعيد الذبحاني في الخدمة الآن.\n"));
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(chalk.red(`🔄 انقطع الاتصال (السبب: ${reason}). جاري إعادة التشغيل...`));
      
      // إعادة التشغيل تلقائياً ما لم يتم تسجيل الخروج يدوياً
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(startSaeedBot, 5000);
      } else {
        console.log(chalk.bgRed("❌ الجلسة غير صالحة، يرجى تحديث ملفات الجلسة أو الربط مجدداً."));
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

      // استجابة الذكاء الاصطناعي عند ذكر اسمك أو كلمة بوت
      const isAI = settings.aiTrigger.some(t => text.toLowerCase().includes(t.toLowerCase()));
      if (isAI && settings.aiEnabled) {
        try {
          const result = await aiModel.generateContent(text);
          return await sock.sendMessage(from, { text: result.response.text() });
        } catch (e) {
          console.log(chalk.red("AI Error:"), e.message);
        }
      }

      // تشغيل معالج الأوامر الخاص بـ "يامي بوت"
      if (typeof handler === 'function') await handler(sock, mek, chatUpdate);
    } catch (err) {
      if (!err.message.includes("Bad MAC")) console.log(err);
    }
  });
}

// انطلاق البوت
startSaeedBot();
