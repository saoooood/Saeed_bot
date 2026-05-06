// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - أوامر الأدوات المتنوعة
// ====================================================

const commands = {};
function addCmd(names, config) { names.forEach(name => { commands[name] = config; }); }

// ===== 1. تحويل النص إلى صوت =====
addCmd(['انطق', 'صوت', 'tts', 'say'], {
  execute: async (ctx) => {
    const { sock, chatId, message, body } = ctx;
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب النص اللي تبي تحوله صوت.' }, { quoted: message });
    
    await sock.sendMessage(chatId, { text: '🔊 جاري تسجيل الصوت...' }, { quoted: message });
    // محاكاة
    await sock.sendMessage(chatId, { text: '✅ (محاكاة) تم إرسال المقطع الصوتي!' }, { quoted: message });
  }
});

// ===== 2. الترجمة =====
addCmd(['ترجم', 'ترجمة', 'tr', 'translate'], {
  execute: async (ctx) => {
    const { sock, chatId, message, body } = ctx;
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب النص اللي تبي ترجمته.' }, { quoted: message });
    
    await sock.sendMessage(chatId, { text: `🌐 *الترجمة:*\n\n(محاكاة) ترجمة النص: ${body}` }, { quoted: message });
  }
});

// ===== 3. البحث في جوجل =====
addCmd(['بحث', 'جوجل', 'google', 'search'], {
  execute: async (ctx) => {
    const { sock, chatId, message, body } = ctx;
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب اللي تبي تبحث عنه.' }, { quoted: message });
    
    await sock.sendMessage(chatId, { text: `🔍 *نتائج البحث عن:* ${body}\n\n1. نتيجة 1\n2. نتيجة 2\n3. نتيجة 3` }, { quoted: message });
  }
});

module.exports = { commands };
