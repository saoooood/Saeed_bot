// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startSaeedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: 'silent' }),
        // تغيير الهوية إلى Safari على Mac لضمان توافق حسابات الأعمال
        browser: Browsers.macOS('Desktop'), 
        syncFullHistory: false, // لتقليل الضغط وتلقي الرسائل الجديدة فوراً
        markOnlineOnConnect: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            console.log('✅ تم الاتصال بنجاح (وضع حساب الأعمال)');
            console.log('📡 في انتظار أول رسالة الآن...');
        } else if (connection === 'close') {
            startSaeedBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 وصلت رسالة من ${from}: ${text}`);

        // رد سريع للتجربة
        await sock.sendMessage(from, { text: 'وصلت رسالتك يا بطل! البوت شغال ✅' });
    });
}
startSaeedBot();
