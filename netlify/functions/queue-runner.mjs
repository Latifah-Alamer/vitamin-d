import { store, push, sendToAll, ANNOUNCEMENTS } from "../lib/shared.mjs";

// كل دقيقة: يرسل التنبيهات المؤجلة اللي جا وقتها
export default async () => {
  // الإعلانات اللي ما انرسلت للحين
  const meta = store("meta");
  const announced = (await meta.get("announced", { type: "json" })) || [];
  for (const a of ANNOUNCEMENTS) {
    if (announced.includes(a.id)) continue;
    const sent = await sendToAll((name) => (name === a.to ? { title: a.title, body: a.body, url: "/" } : null));
    announced.push(a.id);
    await meta.setJSON("announced", announced);
    console.log(`announcement ${a.id} sent: ${sent}`);
  }

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
