import { store, push } from "../lib/shared.mjs";

// كل دقيقة: يرسل التنبيهات المؤجلة اللي جا وقتها
export default async () => {
  const q = store("queue"), subs = store("subs");
  const { blobs } = await q.list();
  const now = Date.now();
  for (const b of blobs) {
    if (Number(b.key.split("-")[0]) > now) continue;
    const item = await q.get(b.key, { type: "json" });
    await q.delete(b.key);
    if (!item) continue;
    const rec = await subs.get(item.subKey, { type: "json" });
    if (!rec) continue;
    try {
      await push(rec.subscription, item.payload);
      console.log("queued push sent to", rec.name);
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await subs.delete(item.subKey);
      console.error("queued push failed", e.statusCode, e.body);
    }
  }
};

export const config = { schedule: "* * * * *" };
