// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

const { default: makeWASocket, useMultiFileAuthState, jidDecode } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startSaeedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Saeed Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
            console.log('✅ البوت متصل ومستعد لاستقبال الرسائل...');
        } else if (connection === 'close') {
            startSaeedBot();
        }
    });

    // هذا الجزء هو المسؤول عن الرد
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // استخراج نص الرسالة سواء كانت في الخاص أو المجموعات
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const from = msg.key.remoteJid;

        console.log(`📩 رسالة جديدة من ${from}: ${text}`); // سيظهر هذا في الـ Logs عند وصول أي رسالة

        if (text.startsWith('.فحص')) {
            await sock.sendMessage(from, { text: 'أنا شغال يا سعيد وموجود! ✅' });
        }
    });
}
startSaeedBot();
