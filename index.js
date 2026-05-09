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
const { smsg } = require('./commands/handler'); // تم تعديل الحرف إلى صغير
const settings = require('./settings');

// إعداد الذكاء الاصطناعي Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startSaeedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
            console.log('✅ تم تشغيل بوت سعيد الضحباني بنجاح!');
        } else if (connection === 'close') {
            startSaeedBot();
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            if (m.key.remoteJid.includes('@newsletter')) return;

            const msg = smsg(sock, m);
            const text = (msg.body || "").trim();

            // 1. نظام الذكاء الاصطناعي Gemini
            const isAI = settings.aiTrigger.some(trigger => text.toLowerCase().includes(trigger.toLowerCase()));
            if (isAI && settings.aiEnabled) {
                const prompt = text.replace(/بوت|سعيد|saeed/gi, '').trim();
                if (prompt) {
                    const result = await model.generateContent(prompt);
                    return await sock.sendMessage(msg.from, { text: result.response.text() });
                }
            }

            // 2. تشغيل الأوامر من مجلد commands (بالحرف الصغير)
            require('./commands/handler')(sock, msg, chatUpdate, m);

        } catch (err) {
            console.log('Error Log:', err);
        }
    });
}

startSaeedBot();
