// ====================================================
//         سعيد بوت 🛡️ - إعدادات النظام الرئيسية
//   Saeed Bot - Main Configuration File
// ====================================================

const settings = {
  // ===== معلومات البوت =====
  botName: "𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️",
  botNameAr: "سعيد بوت",
  version: "3.0.0",
  prefix: ".",

  // ===== أرقام المالك والمطور =====
  ownerNumber: "967770179625",          // رقم صاحب البوت
  ownerName: "سعيد",
  devNumber: "967770179625",            // رقم المطور (نفس رقم المالك)
  devName: "سعيد 🛡️",

  // ===== إعدادات عامة =====
  commandMode: "public",                // public | private
  language: "ar",
  timezone: "Asia/Aden",

  // ===== إعدادات الحماية =====
  antiSpam: true,
  antiLink: false,
  antiBadWords: false,
  antiBot: true,
  antiCall: true,                       // رفض المكالمات تلقائياً
  antiCallKick: true,                   // طرد اللي يتصل

  // ===== إعدادات الترحيب =====
  welcomeMsg: true,
  goodbyeMsg: true,

  // ===== إعدادات الذكاء الاصطناعي =====
  aiEnabled: true,
  aiTrigger: ["سعيد", "saeed", "بوت"],  // كلمات تشغيل الذكاء الاصطناعي

  // ===== حدود الإرسال (مكافحة السبام) =====
  spamMsgLimit: 5,
  spamTimeWindow: 10000,
  spamCooldown: 30000,

  // ===== رسائل النظام (باللهجة اليمنية) =====
  notAdminMsg: "❌ معليش، هذا الأمر للمشرفين بس!",
  notOwnerMsg: "❌ هذا الأمر حقت صاحب البوت فقط!",
  notGroupMsg: "❌ هذا الأمر يشتغل في المجموعات بس!",
  errorMsg: "⚠️ حدث خطأ، حاول مرة ثانية يا صاحبي.",

  // ===== وصف البوت =====
  description: `
╔══════════════════════╗
║   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ v3.0.0   ║
╚══════════════════════╝
بوت واتساب يمني متكامل بالذكاء الاصطناعي
فيه أكثر من 600 أمر متنوع
  `.trim(),

  // ===== مفاتيح API =====
  openaiKey: process.env.OPENAI_API_KEY || "",
  giphyKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
};

module.exports = settings; 
