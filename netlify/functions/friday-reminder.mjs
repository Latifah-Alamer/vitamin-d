import { fridayKey, getPeople, getWeek, sendToAll, took } from "../lib/shared.mjs";

// كل جمعة ١١:٣٠ UTC = ٢:٣٠ العصر بتوقيت السعودية
export default async () => {
  const people = await getPeople();
  const done = await getWeek(fridayKey());
  const sent = await sendToAll((name) => {
    if (done[name]) return null;
    const other = people.find((p) => p !== name);
    return {
      title: "☀️ وقت فيتامين د",
      body: other && done[other] ? `${other} ${took(other)} ✓ وباقي دورك 💊` : "حان وقت حبة فيتامين د 💊",
      url: "/",
    };
  });
  console.log("friday reminder sent:", sent);
};

export const config = { schedule: "30 11 * * 5" };
