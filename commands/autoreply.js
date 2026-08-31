
"use strict";

const timers = new Map();
const configs = new Map();

module.exports = {
  name: "autoreply",
  aliases: ["ردتلقائي", "autoreply"],
  description: "تشغيل رد تلقائي مؤقت للجروب",
  usage: "autoreply <الثواني> <الرد>",

  async execute({ threadID, api, args }) {
    if (!threadID) return;

    // إيقاف الرد التلقائي
    if (args[0] === "off" || args[0] === "ايقاف") {
      const oldTimer = timers.get(threadID);

      if (oldTimer) clearTimeout(oldTimer);

      timers.delete(threadID);
      configs.delete(threadID);

      return api.sendMessage(
        "🛑 تم إيقاف الرد التلقائي.",
        threadID
      );
    }

    if (!args.length) {
      return api.sendMessage(
        "🤖 طريقة الاستخدام:\n" +
        "autoreply 50 مرحبا 👋\n\n" +
        "يعني يرسل الرد بعد مدة عشوائية تقريباً بين الفواصل التي تحددها.\n\n" +
        "للإيقاف:\n" +
        "autoreply off",
        threadID
      );
    }

    const seconds = parseInt(args[0]);

    if (isNaN(seconds) || seconds < 1) {
      return api.sendMessage(
        "❌ اكتب عدد الثواني بشكل صحيح.\nمثال: autoreply 50 مرحبا",
        threadID
      );
    }

    const text = args.slice(1).join(" ");

    if (!text) {
      return api.sendMessage(
        "❌ اكتب نص الرد.\nمثال:\nautoreply 50 مرحبا بالجميع 👋",
        threadID
      );
    }

    if (timers.has(threadID)) {
      clearTimeout(timers.get(threadID));
    }

    configs.set(threadID, {
      api,
      text,
      seconds,
      lastMessage: Date.now()
    });

    startTimer(threadID);

    return api.sendMessage(
      `✅ تم تشغيل الرد التلقائي.\n\n` +
      `⏱️ الفاصل: ${seconds} ثانية\n` +
      `💬 الرد: ${text}\n` +
      `💤 يتوقف بعد 15 دقيقة بدون رسائل.\n\n` +
      `🛑 للإيقاف: autoreply off`,
      threadID
    );
  }
};

function startTimer(threadID) {
  const config = configs.get(threadID);

  if (!config) return;

  const delay =
    Math.floor(Math.random() * config.seconds * 1000) +
    1000;

  const timer = setTimeout(async () => {
    const current = configs.get(threadID);

    if (!current) return;

    // إذا لم تصل أي رسالة لمدة 15 دقيقة
    if (Date.now() - current.lastMessage >= 15 * 60 * 1000) {
      clearTimeout(timer);
      timers.delete(threadID);

      try {
        await current.api.sendMessage(
          "💤 هرب ابن ضعيفة 😂",
          threadID
        );
      } catch (e) {}

      return;
    }

    try {
      await current.api.sendMessage(
        current.text,
        threadID
      );
    } catch (e) {
      console.error("AutoReply Error:", e);
    }

    startTimer(threadID);
  }, delay);

  timers.set(threadID, timer);
}

// استدعها من مستقبل الرسائل عند وصول أي رسالة
function onNewMessage(threadID) {
  const config = configs.get(threadID);

  if (!config) return;

  config.lastMessage = Date.now();

  // إعادة تشغيل المؤقت من جديد
  if (timers.has(threadID)) {
    clearTimeout(timers.get(threadID));
  }

  startTimer(threadID);
}

module.exports.onNewMessage = onNewMessage;
