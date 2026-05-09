// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pino = require('pino');
const { smsg } = require('./handler'); 
require('./settings');

// إعداد الذكاء الاصطناعي Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startSaeedBot() {
    // استخدام مجلد session لتخزين بيانات الاعتماد
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'), // لضمان التوافق مع واتساب أعمال
        syncFullHistory: false
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
            if (m.key.remoteJid.includes('@newsletter')) return; // تجاهل القنوات

            const msg = smsg(sock, m);
            const text = (msg.body || "").trim();
            const from = msg.from;

            // --- أولاً: نظام الذكاء الاصطناعي ---
            if (text.startsWith('بوت') || text.startsWith('سعيد')) {
                const prompt = text.replace(/بوت|سعيد/gi, '').trim();
                if (prompt) {
                    const result = await aiModel.generateContent(prompt);
                    const aiResponse = result.response.text();
                    return await sock.sendMessage(from, { text: aiResponse });
                }
            }

            // --- ثانياً: تشغيل الأوامر الأصلية (Handler) ---
            // هذا السطر يشغل .قائمة وكل أوامر السورس
            require('./handler')(sock, msg, chatUpdate, m);

        } catch (err) {
            console.log('Error:', err);
        }
    });
}

startSaeedBot();
