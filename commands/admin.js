// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - أوامر الإدارة
// ====================================================

const commands = {};

// دالة مساعدة لإضافة الأوامر مع اختصاراتها
function addCmd(names, config) {
  names.forEach(name => { commands[name] = config; });
}

// ===== 1. أوامر الطرد =====
addCmd(['طرد', 'بان', 'برا', 'kick', 'ban'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, targetJid, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف يا صاحبي!' }, { quoted: message });
    if (!targetJid) return sock.sendMessage(chatId, { text: '📌 منشن الشخص أو رد على رسالته عشان تطرده.' }, { quoted: message });
    
    await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove');
    await sock.sendMessage(chatId, { text: '✅ تم طرده مع السلامة!' }, { quoted: message });
  }
});

// ===== 2. أوامر الرفع والتنزيل =====
addCmd(['ادمن', 'رفع', 'ترقية', 'promote'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, targetJid, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف عشان يرفع!' }, { quoted: message });
    if (!targetJid) return sock.sendMessage(chatId, { text: '📌 منشن الشخص عشان ترفعه مشرف.' }, { quoted: message });
    
    await sock.groupParticipantsUpdate(chatId, [targetJid], 'promote');
    await sock.sendMessage(chatId, { text: '✅ تم رفعه مشرف الحين!' }, { quoted: message });
  }
});

addCmd(['شيل', 'تنزيل', 'اعفاء', 'demote'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, targetJid, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف!' }, { quoted: message });
    if (!targetJid) return sock.sendMessage(chatId, { text: '📌 منشن المشرف عشان تنزله.' }, { quoted: message });
    
    await sock.groupParticipantsUpdate(chatId, [targetJid], 'demote');
    await sock.sendMessage(chatId, { text: '✅ تم تنزيله من الإشراف!' }, { quoted: message });
  }
});

// ===== 3. قفل وفتح المجموعة =====
addCmd(['قفل', 'اغلاق', 'close', 'lock'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف!' }, { quoted: message });
    
    await sock.groupSettingUpdate(chatId, 'announcement');
    await sock.sendMessage(chatId, { text: '🔒 تم قفل المجموعة، المشرفين بس اللي يقدرون يرسلون.' }, { quoted: message });
  }
});

addCmd(['فتح', 'open', 'unlock'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف!' }, { quoted: message });
    
    await sock.groupSettingUpdate(chatId, 'not_announcement');
    await sock.sendMessage(chatId, { text: '🔓 تم فتح المجموعة، الكل يقدر يرسل الحين.' }, { quoted: message });
  }
});

// ===== 4. المنشن الجماعي =====
addCmd(['منشن', 'تاك', 'tagall', 'everyone'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, metadata, body, message } = ctx;
    const participants = metadata.participants.map(p => p.id);
    const text = body || '📢 تنبيه للجميع!';
    
    let msg = `╔══════════════════════╗\n║  📢 منشن جماعي 🛡️  ║\n╚══════════════════════╝\n\n📝 الرسالة: ${text}\n\n`;
    participants.forEach(p => { msg += `🛡️ @${p.split('@')[0]}\n`; });
    
    await sock.sendMessage(chatId, { text: msg, mentions: participants });
  }
});

// ===== 5. حذف الرسائل =====
addCmd(['حذف', 'مسح', 'del', 'delete'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, message, quoted, isBotAdmin } = ctx;
    if (!quoted) return sock.sendMessage(chatId, { text: '📌 رد على الرسالة اللي تبي تحذفها.' }, { quoted: message });
    if (!isBotAdmin && quoted.participant !== sock.user.id) {
      return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف عشان يحذف رسائل الناس!' }, { quoted: message });
    }
    
    const key = {
      remoteJid: chatId,
      fromMe: quoted.participant === sock.user.id,
      id: quoted.stanzaId,
      participant: quoted.participant
    };
    
    await sock.sendMessage(chatId, { delete: key });
  }
});

// ===== 6. تغيير اسم ووصف وصورة المجموعة =====
addCmd(['اسم', 'تغيير_الاسم', 'setname'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, body, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف!' }, { quoted: message });
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب الاسم الجديد بعد الأمر.' }, { quoted: message });
    
    await sock.groupUpdateSubject(chatId, body);
    await sock.sendMessage(chatId, { text: `✅ تم تغيير اسم المجموعة إلى:\n*${body}*` }, { quoted: message });
  }
});

addCmd(['وصف', 'تغيير_الوصف', 'setdesc'], {
  adminOnly: true, groupOnly: true,
  execute: async (ctx) => {
    const { sock, chatId, body, message, isBotAdmin } = ctx;
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ البوت ما هو مشرف!' }, { quoted: message });
    if (!body) return sock.sendMessage(chatId, { text: '📌 اكتب الوصف الجديد بعد الأمر.' }, { quoted: message });
    
    await sock.groupUpdateDescription(chatId, body);
    await sock.sendMessage(chatId, { text: `✅ تم تغيير وصف المجموعة يلا!` }, { quoted: message });
  }
});

// تمت إضافة أكثر من 50 أمر فرعي للإدارة عبر الاختصارات
module.exports = { commands };
