import { store, fridayKey, json, getWeek, auth, unauthorized } from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const name = await auth(req);
  if (!name) return unauthorized();
  const { undo } = await req.json().catch(() => ({}));
  const week = fridayKey();
  const cur = await getWeek(week);
  if (undo) delete cur[name];
  else cur[name] = new Date().toISOString();
  await store("checkins").setJSON(week, cur);
  return json({ week, checkins: cur });
};

export const config = { path: "/api/checkin" };
