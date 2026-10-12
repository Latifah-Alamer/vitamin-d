import { store, json, sha, auth, unauthorized, queuePush } from "../lib/shared.mjs";

// تجربة بعد دقيقة، عشان تلحق تقفل الشاشة وتتأكد إنه يوصل والتطبيق مسكّر
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!(await auth(req))) return unauthorized();
  const { endpoint } = await req.json().catch(() => ({}));
  const key = endpoint && (await sha(endpoint));
  if (!key || !(await store("subs").get(key, { type: "json" }))) return json({ error: "هذا الجهاز مو مسجّل للتنبيهات" }, 404);
  const at = await queuePush(key, { title: "☀️ تجربة", body: "التنبيه وصل وكل شي تمام. نشوفك الجمعة 💊", url: "/" }, 60e3);
  return json({ ok: true, at });
};

export const config = { path: "/api/test" };
