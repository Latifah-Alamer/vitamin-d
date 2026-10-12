import { store, json, sha } from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const { endpoint } = await req.json().catch(() => ({}));
  if (endpoint) await store("subs").delete(await sha(endpoint));
  return json({ ok: true });
};

export const config = { path: "/api/unsubscribe" };
