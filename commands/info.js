// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - أوامر المعلومات الفخمة (v3.1.0)
// ====================================================

const settings = require('../settings');
const commands = {};
function addCmd(names, config) { names.forEach(name => { commands[name] = config; }); }

// ===== 1. قائمة الأوامر الفخمة =====
addCmd(['اوامر', 'الاوامر', 'menu', 'help'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    
    const menuText = `
╔══════════════════════╗
║   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ v3.1.0   ║
╚══════════════════════╝

👋 هلا بك في سعيد بوت الفخم!
👑 المالك: +${settings.ownerNumber}
👨‍💻 المطور: +${settings.devNumber}

*🛡️ قسم الإدارة والحماية:*
.طرد | .ادمن | .شيل | .قفل | .فتح
.منشن | .حذف | .اسم | .وصف
.منع_الروابط | .منع_السبام
.ترحيب | .مغادرة

*📞 قسم المكالمات (الكال):*
.طرد_الكال | .كال | .قفل_الكال

*📥 قسم الوسائط:*
.يوتيوب | .تيك | .انستا | .ملصق

*🤖 قسم الذكاء الاصطناعي:*
.ذكاء | .تخيل | .انطق | .ترجم

*🛡️ قسم الأنمي الفخم:*
.انمي | .خلفية | .مانجا | .فخامة

*⚙️ نظام الإضافات (جديد):*
.ضيف [رد على كود] - لإضافة ميزة جديدة فوراً!

*🎮 قسم الترفيه:*
.حجر_ورقة_مقص | .نسبة_الحب | .نكتة

*ℹ️ قسم المعلومات:*
.انفو | .المطور | .المالك | .بنج

_ملاحظة: البوت فيه أكثر من 600 أمر مخفي ومدمج يلا!_
    `.trim();
    
    // إرسال القائمة مع صورة أنمي فخمة
    await sock.sendMessage(chatId, { 
      image: { url: 'https://api.waifu.pics/sfw/waifu' }, 
      caption: menuText 
    }, { quoted: message });
  }
});

// ===== 2. معلومات المجموعة =====
addCmd(['انفو', 'معلومات', 'info'], {
  groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, message, metadata } = ctx;
    
    const infoText = `
*📋 بيانات المجموعة الفخمة:*
*الاسم:* ${metadata.subject}
*الوصف:* ${metadata.desc || 'مافيه وصف'}
*عدد الأعضاء:* ${metadata.participants.length}
*المالك:* @${(metadata.owner || '').split('@')[0]}
    `.trim();
    
    await sock.sendMessage(chatId, { text: infoText, mentions: [metadata.owner] }, { quoted: message });
  }
});

// ===== 3. المطور والمالك =====
addCmd(['المطور', 'مطور', 'dev'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    await sock.sendMessage(chatId, { text: `👨‍💻 *مطور البوت:*\nالاسم: ${settings.devName}\nالرقم: +${settings.devNumber}` }, { quoted: message });
  }
});

addCmd(['المالك', 'صاحب', 'owner'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    await sock.sendMessage(chatId, { text: `👑 *مالك البوت:*\nالاسم: ${settings.ownerName}\nالرقم: +${settings.ownerNumber}` }, { quoted: message });
  }
});

// ===== 4. سرعة الاستجابة =====
addCmd(['بنج', 'سرعة', 'ping'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    const start = Date.now();
    await sock.sendMessage(chatId, { text: '🏓 بونج...' }, { quoted: message });
    const end = Date.now();
    await sock.sendMessage(chatId, { text: `🚀 سرعة البوت: ${end - start}ms` }, { quoted: message });
  }
});

module.exports = { commands };
