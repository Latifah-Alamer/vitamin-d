import { store, fridayKey, json, getPeople, getWeek, auth } from "../lib/shared.mjs";

export default async (req) => {
  const week = fridayKey();
  const { blobs } = await store("checkins").list();
  const past = blobs.map((b) => b.key).filter((k) => k < week).sort().reverse().slice(0, 60); // ~سنة، للدوري الشهري
  const history = [];
  for (const k of past) history.push({ week: k, checkins: await getWeek(k) });
  return json({
    people: await getPeople(),
    accounts: Object.keys((await store("meta").get("pins", { type: "json" })) || {}),
    me: await auth(req),
    week,
    checkins: await getWeek(week),
    history,
    vapidKey: process.env.VAPID_PUBLIC_KEY || null,
  });
};

export const config = { path: "/api/state" };
