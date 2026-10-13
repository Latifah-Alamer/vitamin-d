import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export const store = (name) => getStore({ name, consistency: "strong" });

// مفتاح الأسبوع = تاريخ جمعة هذا الأسبوع (السبت → الجمعة) بتوقيت الرياض
export function fridayKey(d = new Date()) {
  const r = new Date(d.getTime() + 3 * 3600e3);
  const diff = (5 - r.getUTCDay() + 7) % 7;
  r.setUTCDate(r.getUTCDate() + diff);
  return r.toISOString().slice(0, 10);
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export async function sha(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const DEFAULT_PEOPLE = ["لطيفة", "إبراهيم"];
// وقت تذكير كل شخص يوم الجمعة (بتوقيت السعودية)
export const REMINDER_TIMES = { "لطيفة": "14:30", "إبراهيم": "13:30" };
export const timeOf = (name) => REMINDER_TIMES[name] || "14:30";
export const timeLabel = (hm) => {
  let [h, m] = hm.split(":").map(Number);
  const ar = (n) => n.toLocaleString("ar-SA");
  const part = h < 12 ? "الصبح" : h < 14 ? "الظهر" : h < 18 ? "العصر" : "المساء";
  h = h % 12 || 12;
  return `${ar(h)}:${m.toString().padStart(2, "0").replace(/\d/g, (d) => ar(+d))} ${part}`;
};
// الوقت الحين بتوقيت السعودية بالدقائق
export const riyadhMinutes = (d = new Date()) => { const r = new Date(d.getTime() + 3 * 3600e3); return r.getUTCHours() * 60 + r.getUTCMinutes(); };
export const getPeople = async () => (await store("meta").get("people", { type: "json" })) || DEFAULT_PEOPLE;
const FEM = { "لطيفة": true };
export const took = (n) => (FEM[n] ? "أخذت حبتها" : "أخذ حبته");
export const getWeek = async (week) => (await store("checkins").get(week, { type: "json" })) || {};

let vapidReady = false;
export function push(subscription, payload) {
  if (!vapidReady) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    vapidReady = true;
  }
  return webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 6 * 3600 });
}

// يرسل لكل الأجهزة المسجلة. build(name) يرجّع نص التنبيه أو null للتخطي
export async function sendToAll(build) {
  const subs = store("subs");
  const { blobs } = await subs.list();
  let sent = 0;
  for (const b of blobs) {
    const rec = await subs.get(b.key, { type: "json" });
    if (!rec) continue;
    const payload = build(rec.name);
    if (!payload) continue;
    try {
      await push(rec.subscription, payload);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await subs.delete(b.key);
      else console.error("push failed", e.statusCode, e.body);
    }
  }
  return sent;
}

// الحسابات
export const hashPin = (name, pin) => sha(`vd:${name}:${pin}`);
export async function auth(req) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!t) return null;
  const sess = await store("sessions").get(t, { type: "json" });
  return sess?.name || null;
}
export const unauthorized = () => json({ error: "سجّل دخولك من جديد" }, 401);

// طابور تنبيهات مؤجلة (ترحيب وتجربة). يرسلها queue-runner كل دقيقة
export async function queuePush(subKey, payload, delayMs) {
  const at = Date.now() + delayMs;
  await store("queue").setJSON(`${at}-${Math.random().toString(36).slice(2, 8)}`, { subKey, payload, at });
  return at;
}

// إعلانات تنرسل مرة وحدة بس، أول ما ينشر الموقع (يرسلها queue-runner)
// لإعلان جديد: أضيفي سطر بـ id جديد
export const ANNOUNCEMENTS = [
  {
    id: "ibrahim-time-1330",
    to: "إبراهيم",
    title: "⏰ تغيّر وقت تذكيرك",
    body: "صار تذكير فيتامين د يوصلك كل جمعة ١:٣٠ الظهر، وعندك ربع ساعة للنقطة الإضافية ⚡",
  },
];
