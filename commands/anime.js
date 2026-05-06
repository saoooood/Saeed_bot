// ====================================================
//   𝑺𝒂𝒆𝒆𝒅 𝑩𝒐𝒕 🛡️ - قسم صور الأنمي الفخمة
// ====================================================

const axios = require('axios');
const commands = {};
function addCmd(names, config) { names.forEach(name => { commands[name] = config; }); }

// دالة لجلب صور أنمي فخمة
async function getAnimePic(type) {
  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${type}`);
    return res.data.url;
  } catch (e) {
    return 'https://telegra.ph/file/0c0f0f0f0f0f0f0f0f0f0.jpg'; // صورة بديلة
  }
}

// ===== أوامر صور الأنمي =====
addCmd(['انمي', 'anime', 'فخامة'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    await sock.sendMessage(chatId, { text: '⏳ يلا شوية، جاري جلب صورة أنمي فخمة...' }, { quoted: message });
    const url = await getAnimePic('waifu');
    await sock.sendMessage(chatId, { 
      image: { url }, 
      caption: '🛡️ *سعيد بوت - فخامة الأنمي*\n\nتم جلب الصورة يلا! ✨' 
    }, { quoted: message });
  }
});

addCmd(['خلفية', 'wallpaper', 'wall'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    await sock.sendMessage(chatId, { text: '⏳ جاري جلب خلفية فخمة...' }, { quoted: message });
    // محاكاة جلب خلفية
    const url = 'https://pic.re/image'; 
    await sock.sendMessage(chatId, { 
      image: { url: 'https://api.waifu.pics/sfw/waifu' }, 
      caption: '🖼️ *سعيد بوت 🛡️ - خلفيات فخمة*\n\nخلفية أنمي جودة عالية! ✨' 
    }, { quoted: message });
  }
});

addCmd(['مانجا', 'manga'], {
  execute: async (ctx) => {
    const { sock, chatId, message } = ctx;
    await sock.sendMessage(chatId, { text: '⏳ جاري جلب صورة مانجا...' }, { quoted: message });
    const url = await getAnimePic('neko');
    await sock.sendMessage(chatId, { 
      image: { url }, 
      caption: '📖 *سعيد بوت 🛡️ - عالم المانجا*\n\nصورة مانجا فخمة! ✨' 
    }, { quoted: message });
  }
});

module.exports = { commands };
