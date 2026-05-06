// ====================================================
//         𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - الملف الرئيسي
//   بوت واتساب يمني متكامل بأكثر من 600 أمر
//   المطور والمالك: 967770179625
// ====================================================

// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - ربط عبر رقم الهاتف
// ====================================================

cat > index.js << 'EOF'
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk@4.1.2');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['سعيد بوت', 'Chrome', '120.0.0'],
        logger: require('pino')({ level: 'silent' }),
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 10000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.green('\n✅ سعيد بوت اشتغل وجاهز!\n'));
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('❌ تم تسجيل الخروج. امسح المجلد session و حاول مرة ثانية'));
                process.exit(0);
            } else {
                console.log(chalk.yellow('🔁 جاري إعادة الاتصال...'));
                (async () => await startBot())();
            }
        }
    });

    // طلب رمز الاقتران بعد 2 ثانية من الاتصال
    setTimeout(async () => {
        if (!sock.authState.creds.registered) {
            console.log(chalk.cyan('\n📱 رقمك الدولي (مثال: 967770179625):'));
            const phoneNumber = await question('');
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
            console.log(chalk.green(`✅ جاري إرسال الرمز إلى ${formattedNumber}`));
            try {
                const code = await sock.requestPairingCode(formattedNumber);
                console.log(chalk.magenta(`\n🔐 رمز الاقتران: ${code}\n`));
                console.log(chalk.cyan('افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز ← أدخل الرمز'));
                rl.close();
            } catch (err) {
                console.log(chalk.red('❌ خطأ في طلب الرمز:', err.message));
            }
        }
    }, 2000);
})();
EOF
