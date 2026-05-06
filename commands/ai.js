// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - أوامر الذكاء الاصطناعي (Gemini)
// ====================================================

const settings = require('../settings');
const commands = {};
function addCmd(names, config) { names.forEach(name => { commands[name] = config; }); }

// ===== مفتاح Gemini من المتغيرات البيئية =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || settings.geminiKey || "";

// ===== دالة الاتصال بـ Gemini API =====
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    return "⚠️ معليش، مافيه مفتاح Gemini! تأكد من إضافة GEMINI_API_KEY في ملف .env";
  }
  
  try {
    const axios = require('axios');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || "ما فهمتك، حاول مرة ثانية يا صاحبي 🛡️";
  } catch (error) {
    console.error('Gemini Error:', error.response?.data || error.message);
    return "⚠️ خطأ في الاتصال بـ Gemini، حاول بعد شوية.";
  }
}

// ===== 1. الرد التلقائي للذكاء الاصطناعي =====
async function handleAIChat(sock, message, text, chatId) {
  try {
    if (!text || text.length < 2) return;
    
    const reply = await callGemini(text);
    await sock.sendMessage(chatId, { text: `🛡️ *سعيد بوت:*\n\n${reply}` }, { quoted: message });
  } catch (e) {
    console.error('AI Error:', e);
    await sock.sendMessage(chatId, { text: '⚠️ صار خطأ، حاول بعد شوية.' }, { quoted: message });
  }
}

// ===== 2. أمر الذكاء الاصطناعي المباشر =====
addCmd(['ذكاء', 'ai', 'gemini', 'سعيد'], {
  execute: async (ctx) => {
    const { sock, chatId, message, body } = ctx;
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب سؤالك بعد الأمر.\nمثال: .ذكاء وش أخبارك؟' }, { quoted: message });
    
    await sock.sendMessage(chatId, { text: '⏳ يلا شوية، جاري التفكير...' }, { quoted: message });
    
    const reply = await callGemini(body);
    await sock.sendMessage(chatId, { text: `🤖 *سعيد بوت 🛡️:*\n\n${reply}` }, { quoted: message });
  }
});

// ===== 3. تحويل النص إلى صورة (Gemini لا يدعم رسم الصور حالياً) =====
addCmd(['تخيل', 'رسم', 'imagine', 'draw'], {
  execute: async (ctx) => {
    const { sock, chatId, message, body } = ctx;
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب وصف الصورة اللي تبي ترسمها.' }, { quoted: message });
    
    await sock.sendMessage(chatId, { text: '🎨 جاري رسم الصورة...' }, { quoted: message });
    
    // Gemini حالياً ما يدعم رسم الصور، نرسل رسالة توضيحية
    setTimeout(async () => {
      await sock.sendMessage(chatId, { text: `⚠️ معليش يا صاحبي، خدمة رسم الصور تحتاج OpenAI DALL-E.\nلكن تقدر تستخدم .ذكاء وتسأل أي شيء ثاني 🛡️` }, { quoted: message });
    }, 1500);
  }
});

module.exports = { commands, handleAIChat };
