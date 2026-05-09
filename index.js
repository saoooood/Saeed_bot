// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pino = require('pino');
const { smsg } = require('./Commands/handler'); // تعديل المسار ليدخل مجلد Commands
const settings = require('./settings');
// ... باقي الكود ...

// وتأكد من تعديل سطر التشغيل في الأسفل أيضاً:
require('./Commands/handler')(sock, msg, chatUpdate, m);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startSaeedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop')
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') console.log('✅ تم التشغيل بنجاح يا سعيد!');
        if (connection === 'close') startSaeedBot();
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        const msg = smsg(sock, m);
        const text = msg.body || "";

        // تشغيل الذكاء الاصطناعي إذا بدأت الرسالة بكلمة من aiTrigger
        const isAI = settings.aiTrigger.some(trigger => text.includes(trigger));
        
        if (isAI && settings.aiEnabled) {
            const prompt = text.replace(/بوت|سعيد|saeed/gi, '').trim();
            const result = await model.generateContent(prompt);
            return await sock.sendMessage(msg.from, { text: result.response.text() });
        }

        // تشغيل الأوامر العادية من الـ Handler
        require('./handler')(sock, msg, chatUpdate, m);
    });
}
startSaeedBot();
