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

async function startSaeedBot() {
    // استخدام مجلد جديد تماماً لتجنب أي تعليق من المحاولات السابقة
    const { state, saveCreds } = await useMultiFileAuthState('./session_final_fix');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        // --- تغيير هوية المتصفح لجهاز ماك لتخطي حظر الربط ---
        browser: ["Mac OS", "Safari", "15.0"] 
    });

    if (!sock.authState.creds.registered) {
        const myNumber = "966570988808"; 

        setTimeout(async () => {
            try {
                let pairingCode = await sock.requestPairingCode(myNumber);
                pairingCode = pairingCode?.match(/.{1,4}/g)?.join("-") || pairingCode;
                
                console.log("\n" + "=".repeat(50));
                console.log("🚀 هوية جديدة (Safari/Mac) - كود الربط:");
                console.log("");
                console.log("   👉  " + pairingCode + "  👈   ");
                console.log("");
                console.log("أدخله الآن في الواتساب وبإذن الله يضبط");
                console.log("=".repeat(50) + "\n");
            } catch (err) {
                console.log("❌ خطأ: " + err.message);
            }
        }, 6000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text === '.قائمة' || text === '.اوامر') {
            await sock.sendMessage(from, { text: '🌟 هلا سعيد! البوت شغال بالهوية الجديدة.' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('\n✅ تم الاتصال! الهوية الجديدة اشتغلت.\n');
        } else if (connection === 'close') {
            startSaeedBot();
        }
    });
}

startSaeedBot();
