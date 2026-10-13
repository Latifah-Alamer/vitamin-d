import { fridayKey, getPeople, getWeek, sendToAll, timeOf, riyadhMinutes } from "../lib/shared.mjs";

// يشتغل الجمعة ١٠:٣٠ و١١:٣٠ UTC = ١:٣٠ و٢:٣٠ بتوقيت السعودية
// ويرسل لكل شخص في وقته بس. إذا شغّلتيه يدوي (Run now) بوقت ثاني، يرسل للكل
export default async () => {
  const people = await getPeople();
  const done = await getWeek(fridayKey());
  const now = riyadhMinutes();
  const toMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
  let due = people.filter((p) => Math.abs(toMin(timeOf(p)) - now) <= 10);
  const manual = due.length === 0;
  if (manual) due = people;

  const sent = await sendToAll((name) => {
    if (!due.includes(name) || done[name]) return null;
    return {
      title: "☀️ وقت فيتامين د",
      body: "حان وقت حبتك 💊 سجّلها خلال ربع ساعة وخذ النقطة الإضافية ⚡",
      url: "/",
    };
  });
  console.log(`friday reminder sent: ${sent}${manual ? " (manual run)" : ""} to: ${due.join(", ")}`);
};

export const config = { schedule: "30 10,11 * * 5" };
