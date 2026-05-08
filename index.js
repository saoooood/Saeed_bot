// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// وظيفة لفك تشفير سشن KnightBot
async function decodeSession() {
    const sessionId = process.env.SESSION_ID;
    if (!sessionId) return null;
    
    // إزالة كلمة KnightBot! إذا كانت موجودة وتحويل النص المشفر إلى ملف
    const cleanedSession = sessionId.replace(/KnightBot!/g, "");
    const sessionPath = path.join(__dirname, 'session');
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);
    
    // فك التشفير (بناءً على نظام KnightBot المشهور)
    try {
        const decodedData = Buffer.from(cleanedSession, 'base64').toString('utf-8');
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), decodedData);
        console.log("✅ تم فك تشفير السشن بنجاح!");
    } catch (e) {
        console.log("❌ خطأ في تنسيق السشن: تأكد من نسخه كاملاً.");
    }
}

async function startSaeedBot() {
    await decodeSession(); // تشغيل فك التشفير أولاً

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        browser: ["Saeed Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('\n=====================================');
            console.log('🚀 البوت شغال الآن يا سعيد! جرب أرسل كلمة (.قائمة)');
            console.log('=====================================\n');
        } else if (connection === 'close') {
            console.log('🔄 جاري إعادة الاتصال...');
            startSaeedBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text === '.قائمة' || text === '.اوامر') {
            await sock.sendMessage(from, { text: '🌟 هلا سعيد! البوت متصل بالكامل ومستعد لخدمتك.' });
        }
        if (text === '.فحص') {
            await sock.sendMessage(from, { text: '✅ البوت مستجيب وشغال 100%' });
        }
    });
}

startSaeedBot();
