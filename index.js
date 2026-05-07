// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

const crypto = require('crypto'); // حل مشكلة التشفير
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startSaeedBot() {
    // إعداد الجلسة وحفظ الملفات في مجلد session
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // تقليل الرسائل المزعجة في الشاشة
        printQRInTerminal: false, 
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // طلب كود الربط إذا لم يكن الحساب مسجلاً
    if (!sock.authState.creds.registered) {
        // --- ضع رقمك هنا بالصيغة الدولية بدون + ---
        const myNumber = "967770179625"; 

        console.log(`\n⏳ جاري طلب كود الربط للرقم: ${myNumber}...`);
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("\n" + "=".repeat(40));
                console.log("✅ كود الربط الخاص بك هو: " + code);
                console.log("=".repeat(40) + "\n");
            } catch (error) {
                console.log("❌ فشل طلب الكود: ", error.message);
            }
        }, 5000);
    }

    // حفظ التحديثات واستلام الرسائل
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text === '.قائمة') {
            await sock.sendMessage(from, { text: '🌟 أهلاً بك يا سعيد! البوت شغال الآن بنجاح.' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('🚀 متصل الآن! جرب أرسل (.قائمة) في الواتساب.');
        } else if (connection === 'close') {
            startSaeedBot(); // إعادة الاتصال التلقائي
        }
    });
}

startSaeedBot();
