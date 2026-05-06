// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - معالج الأوامر الفخم (v3.1.0)
// ===================================================

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

// استيراد الأقسام الأساسية
const adminCmds = require('./admin');
const protectionCmds = require('./protection');
const mediaCmds = require('./media');
const funCmds = require('./fun');
const aiCmds = require('./ai');
const utilCmds = require('./utils');
const callCmds = require('./call_commands');
const infoCmds = require('./info');
const animeCmds = require('./anime'); // القسم الجديد

// ===== نظام الإضافات (Plugins) =====
const pluginsPath = path.join(__dirname, '..', 'plugins');
if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath);

function loadPlugins() {
  const plugins = {};
  const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'));
  files.forEach(file => {
    try {
      const plugin = require(path.join(pluginsPath, file));
      if (plugin.commands) Object.assign(plugins, plugin.commands);
    } catch (e) { console.error(`خطأ في تحميل الإضافة ${file}:`, e.message); }
  });
  return plugins;
}

async function handleMessages(sock, chatUpdate, store) {
  try {
    const message = chatUpdate.messages[0];
    if (!message?.message) return;

    const chatId = message.key.remoteJid;
    const isGroup = chatId?.endsWith('@g.us');
    const senderId = message.key.participant || message.key.remoteJid;
    const senderNumber = senderId?.split('@')[0];
    const isFromMe = message.key.fromMe;

    // استخراج النص
    const msgType = Object.keys(message.message)[0];
    const userMessage = (
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      message.message.imageMessage?.caption ||
      message.message.videoMessage?.caption ||
      ''
    ).toString().trim();

    const lowerMsg = userMessage.toLowerCase();
    const prefix = settings.prefix;

    // نظام إضافة الأكواد التلقائي (.ضيف)
    if (userMessage.startsWith(prefix + 'ضيف') || userMessage.startsWith(prefix + 'add')) {
      const isOwner = isFromMe || senderNumber === settings.ownerNumber || senderNumber === settings.devNumber;
      if (!isOwner) return sock.sendMessage(chatId, { text: '❌ هذا الأمر حقت المالك فقط!' }, { quoted: message });
      
      let code = '';
      const quotedMsg = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quotedMsg) {
        code = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
      } else {
        code = userMessage.replace(prefix + 'ضيف', '').replace(prefix + 'add', '').trim();
      }

      if (!code) return sock.sendMessage(chatId, { text: '📌 رد على الكود أو اكتبه بعد الأمر عشان أضيفه.' }, { quoted: message });

      const fileName = `plugin_${Date.now()}.js`;
      fs.writeFileSync(path.join(pluginsPath, fileName), code);
      return sock.sendMessage(chatId, { text: `✅ تم إضافة الكود في ملف: ${fileName}\nحيفتعل معاك فوراً!` }, { quoted: message });
    }

    // التحقق من البادئة
    if (!userMessage.startsWith(prefix) && !isFromMe) {
      if (settings.aiEnabled && settings.aiTrigger.some(t => lowerMsg.includes(t.toLowerCase()))) {
        await aiCmds.handleAIChat(sock, message, userMessage, chatId);
      }
      return;
    }

    const args = userMessage.slice(prefix.length).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase();
    const body = args.join(' ');

    if (!cmd) return;

    // تحميل الأوامر (بما في ذلك الإضافات)
    const ALL_COMMANDS = {
      ...adminCmds.commands,
      ...protectionCmds.commands,
      ...mediaCmds.commands,
      ...funCmds.commands,
      ...aiCmds.commands,
      ...utilCmds.commands,
      ...callCmds.commands,
      ...infoCmds.commands,
      ...animeCmds.commands,
      ...loadPlugins()
    };

    const isOwner = isFromMe || senderNumber === settings.ownerNumber || senderNumber === settings.devNumber;
    let isAdmin = false;
    let isBotAdmin = false;
    let metadata = null;

    if (isGroup) {
      try {
        metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;
        const senderParticipant = participants.find(p => p.id === senderId);
        isAdmin = senderParticipant?.admin !== null;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        isBotAdmin = participants.find(p => p.id === botId)?.admin !== null;
      } catch (e) {}
    }

    let targetJid = message.message.extendedTextMessage?.contextInfo?.participant || message.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || '';

    const ctx = {
      sock, message, chatId, senderId, senderNumber,
      isGroup, isOwner, isAdmin, isBotAdmin,
      metadata, targetJid, args, body, cmd,
      quoted: message.message.extendedTextMessage?.contextInfo,
      msgType, store, settings
    };

    if (ALL_COMMANDS[cmd]) {
      const cmdObj = ALL_COMMANDS[cmd];
      if (cmdObj.ownerOnly && !isOwner) return sock.sendMessage(chatId, { text: settings.notOwnerMsg }, { quoted: message });
      if (cmdObj.adminOnly && !isAdmin && !isOwner) return sock.sendMessage(chatId, { text: settings.notAdminMsg }, { quoted: message });
      if (cmdObj.groupOnly && !isGroup) return sock.sendMessage(chatId, { text: settings.notGroupMsg }, { quoted: message });

      await cmdObj.execute(ctx);
    }

  } catch (e) {
    console.error('خطأ في المعالج:', e.message);
  }
}

module.exports = { handleMessages };
