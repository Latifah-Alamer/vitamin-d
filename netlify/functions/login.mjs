import { store, json, getPeople, hashPin } from "../lib/shared.mjs";

// أول دخول لكل اسم ينشئ الحساب برمزه، وبعدها لازم نفس الرمز
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const { name, pin } = await req.json().catch(() => ({}));
  if (!(await getPeople()).includes(name)) return json({ error: "الحساب غير موجود" }, 400);
  if (!/^\d{4}$/.test(String(pin || ""))) return json({ error: "الرمز لازم يكون ٤ أرقام" }, 400);

  const meta = store("meta");
  const pins = (await meta.get("pins", { type: "json" })) || {};
  const fails = (await meta.get("fails", { type: "json" })) || {};
  const f = fails[name] || { n: 0, until: 0 };
  if (f.until > Date.now()) return json({ error: "محاولات كثيرة، جرّب بعد ١٠ دقايق" }, 429);

  const h = await hashPin(name, pin);
  if (!pins[name]) {
    pins[name] = h;
    await meta.setJSON("pins", pins);
  } else if (pins[name] !== h) {
    f.n += 1;
    if (f.n >= 5) { f.n = 0; f.until = Date.now() + 10 * 60e3; }
    fails[name] = f; await meta.setJSON("fails", fails);
    return json({ error: "الرمز غلط" }, 401);
  }
  if (fails[name]) { delete fails[name]; await meta.setJSON("fails", fails); }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await store("sessions").setJSON(token, { name, created: new Date().toISOString() });
  return json({ token, name });
};

export const config = { path: "/api/login" };
