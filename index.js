// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================
const crypto = require('crypto');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startSaeedBot() {
    // استخدام مجلد جديد للجلسة لضمان عدم وجود أخطاء قديمة
    const { state, saveCreds } = await useMultiFileAuthState('./session_new');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        // تغيير اسم الجهاز لضمان ربط نظيف
        browser: ["Saeed Pro Bot", "Chrome", "1.0.0"]
    });

    if (!sock.authState.creds.registered) {
        // --- ضع رقمك هنا بالصيغة الدولية ---
        const myNumber = "96777xxxxxxx"; 

        console.log(`\n⏳ جاري طلب كود الربط للرقم: ${myNumber}...`);
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("\n" + "=".repeat(40));
                console.log("✅ كود الربط الجديد هو: " + code);
                console.log("=".repeat(40) + "\n");
            } catch (error) {
                console.log("❌ فشل طلب الكود، تأكد من الرقم: ", error.message);
            }
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    // الأوامر البرمجية
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 رسالة جديدة من ${from}: ${text}`);

        if (text === '.قائمة' || text === '.اوامر') {
            await sock.sendMessage(from, { 
                text: '🌟 أهلاً بك يا سعيد!\n\nالبوت شغال بنجاح الآن. ✅\n\nالأوامر المتاحة:\n1️⃣ .فحص\n2️⃣ .قائمة' 
            });
        }
        
        if (text === '.فحص') {
            await sock.sendMessage(from, { text: '🚀 البوت يعمل بسرعة فائقة!' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('🚀 تم الاتصال بنجاح! البوت الآن جاهز للرد على رسائلك.');
        } else if (connection === 'close') {
            console.log('🔄 جاري إعادة الاتصال...');
            startSaeedBot();
        }
    });
}

startSaeedBot();
