import { fridayKey, getWeek, sendToAll } from "../lib/shared.mjs";

// تذكير ثاني ٨ المساء (١٧:٠٠ UTC) لمن ما سجّل. احذف هذا الملف إذا ما تبيه.
export default async () => {
  const done = await getWeek(fridayKey());
  const sent = await sendToAll((name) =>
    done[name] ? null : { title: "🌙 فيتامين د", body: "لسّا ما انسجّلت حبة هالأسبوع", url: "/" }
  );
  console.log("evening reminder sent:", sent);
};

export const config = { schedule: "0 17 * * 5" };
