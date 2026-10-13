import { store, json, sha, auth, unauthorized, queuePush, timeOf, timeLabel } from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const name = await auth(req);
  if (!name) return unauthorized();
  const { subscription } = await req.json().catch(() => ({}));
  if (!subscription?.endpoint) return json({ error: "اشتراك غير صالح" }, 400);
  const subs = store("subs");
  const key = await sha(subscription.endpoint);
  const isNew = !(await subs.get(key, { type: "json" }));
  await subs.setJSON(key, { subscription, name });
  // تنبيه ترحيب بعد ٣ دقايق: يتأكد إن المهام المجدولة والتنبيهات شغالة والتطبيق مقفل
  if (isNew) {
    await queuePush(key, { title: `أهلاً ${name} 👋`, body: `التنبيهات شغالة. نشوفك الجمعة ${timeLabel(timeOf(name))} 💊`, url: "/" }, 3 * 60e3);
  }
  return json({ ok: true, welcome: isNew });
};

export const config = { path: "/api/subscribe" };
