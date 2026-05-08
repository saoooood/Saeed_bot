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
const crypto = require('crypto');
const http = require('http'); // مكتبة ضرورية لـ Render

// إنشاء سيرفر بسيط لإيهام Render أن الخدمة تعمل
http.createServer((req, res) => {
    res.write('Saeed Bot is Running!');
    res.end();
}).listen(process.env.PORT || 3000);

async function startSaeedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session_render');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        browser: ["Saeed Render Bot", "Chrome", "1.0.0"]
    });

    if (!sock.authState.creds.registered) {
        const myNumber = "967770179625"; 
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("\n" + "=".repeat(30));
                console.log("✅ كود الربط لـ Render هو: " + code);
                console.log("=".repeat(30) + "\n");
            } catch (err) { console.log("خطأ: " + err.message); }
        }, 8000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text === '.قائمة') {
            await sock.sendMessage(from, { text: '🌟 هلا سعيد! البوت شغال الآن من سيرفر ريندر بنجاح.' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log('🚀 البوت متصل ومستقر على ريندر!');
        else if (connection === 'close') startSaeedBot();
    });
}

startSaeedBot();
