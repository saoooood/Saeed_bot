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
    // استخدام مجلد جديد للجلسة لضمان الترتيب
    const { state, saveCreds } = await useMultiFileAuthState('./session_Saeed');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // طلب كود الربط إذا لم يكن مسجلاً
    if (!sock.authState.creds.registered) {
        const myNumber = "967770179625"; 

        setTimeout(async () => {
            try {
                let pairingCode = await sock.requestPairingCode(myNumber);
                pairingCode = pairingCode?.match(/.{1,4}/g)?.join("-") || pairingCode;
                
                // تنسيق الكود ليظهر بشكل مرتب جداً في GitHub
                console.log("\n" + "=".repeat(50));
                console.log("🚀 أهلاً يا سعيد! كود الربط الخاص بك جاهز الآن:");
                console.log("");
                console.log("   👉  " + pairingCode + "  👈   ");
                console.log("");
                console.log("قم بإدخال هذا الكود في واتساب (ربط الأجهزة)");
                console.log("=".repeat(50) + "\n");
            } catch (err) {
                console.log("❌ خطأ في طلب الكود: " + err.message);
            }
        }, 6000); // تأخير بسيط لضمان استقرار السيرفر
    }

    sock.ev.on('creds.update', saveCreds);

    // استقبال الأوامر
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text === '.قائمة') {
            await sock.sendMessage(from, { text: '🌟 أهلاً سعيد! البوت شغال الآن ومنتظر أوامرك.' });
        }
        
        if (text === '.فحص') {
            await sock.sendMessage(from, { text: '✅ البوت شغال بنجاح!' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('\n✅ تم الاتصال بنجاح! البوت الآن نشط على واتسابك.\n');
        } else if (connection === 'close') {
            startSaeedBot();
        }
    });
}

startSaeedBot();
