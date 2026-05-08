// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك : 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

cconst { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const crypto = require('crypto');

async function startSaeedBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session_final_fix');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        browser: ["Mac OS", "Safari", "15.0"] 
    });

    if (!sock.authState.creds.registered) {
        const myNumber = "967770179625"; 
        setTimeout(async () => {
            try {
                let pairingCode = await sock.requestPairingCode(myNumber);
                pairingCode = pairingCode?.match(/.{1,4}/g)?.join("-") || pairingCode;
                console.log("\n🚀 كود الربط: " + pairingCode + "\n");
            } catch (err) { console.log("❌ خطأ: " + err.message); }
        }, 6000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text === '.قائمة' || text === '.اوامر') {
            await sock.sendMessage(from, { text: '🌟 هلا سعيد! البوت شغال الآن بنسبة 100% ولن يتوقف.' });
        }
        if (text === '.فحص') {
            await sock.sendMessage(from, { text: '✅ البوت مستيقظ ويعمل!' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('\n✅ تم الاتصال! البوت الآن نشط ولن يغلق.\n');
        } else if (connection === 'close') {
            startSaeedBot();
        }
    });

    // --- السطر السحري لمنع السيرفر من الإغلاق ---
    setInterval(() => { }, 1000 * 60 * 60); 
}

startSaeedBot();
