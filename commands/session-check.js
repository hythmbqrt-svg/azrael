
"use strict";

const cookieRefresher = require("../utils/cookieRefresher");

module.exports = {
  name: "session-check",
  aliases: ["session", "جلسة", "فحص-الجلسة"],
  description: "فحص حالة جلسة الكوكيز وتحديثها فورًا.",
  usage: "session-check",
  category: "Info",

  async execute({ api, event }) {
    const { threadID } = event;

    try {
      // تحديث الكوكيز فورًا
      await cookieRefresher.forceRefresh();

      // قراءة الحالة بعد التحديث
      const s = cookieRefresher.status();

      const active = s.active
        ? "🟢 الجلسة تعمل"
        : "🔴 الجلسة غير نشطة";

      const lastPush = s.lastPushAt
        ? new Date(s.lastPushAt).toLocaleString("ar-DZ")
        : "لا يوجد";

      const msg =
        "╭──────────────╮\n" +
        "   🔐 فحص جلسة الكوكيز\n" +
        "╰──────────────╯\n\n" +
        `الحالة: ${active}\n` +
        `🔄 آخر تحديث: ${lastPush}\n` +
        `📤 عدد التحديثات: ${s.pushCount || 0}\n` +
        `⚠️ الأخطاء: ${s.errorCount || 0}\n` +
        `⏱️ الفحص كل: ${s.intervalMinutes || 4} دقائق`;

      return api.sendMessage(msg, threadID);

    } catch (err) {
      return api.sendMessage(
        "🔴 تعذر تحديث جلسة الكوكيز.\n\n" +
        `السبب: ${err.message}`,
        threadID
      );
    }
  }
};
