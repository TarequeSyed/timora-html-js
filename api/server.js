// api/generate-plan.js
import { config } from "dotenv";
config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { subjects, hours, days, goal } = req.body || {};

  if (!subjects || !subjects.length) {
    return res.status(400).json({ error: "Subjects missing" });
  }

  // Safe JSON parser
  const safeJSON = (txt) => {
    try {
      return JSON.parse(txt);
    } catch {
      return null;
    }
  };

  // AI prompt
  const prompt = `
You are Timora AI, a professional study schedule generator.

### USER INPUT
Subjects: ${subjects.join(", ")}
Daily Study Limit: ${hours} hours
Total Days: ${days}
Goal: ${goal}

### RULES (STRICT)
1. Total study hours per day MUST NOT exceed ${hours}.
2. Each study block = MAX 1 hour.
3. After each block add 10–15 min micro break.
4. After 3–4 blocks add 30–60 min long break.
5. Every day MUST include: Breakfast, Lunch, Dinner, Free Time.
6. Allowed break labels: Break, Rest, Free Time, Snack Break, Nap, Stretching, Walk, Lunch, Dinner, Breakfast.
7. Never exceed ${hours}h per day.
8. Remaining time = breaks only.
9. Output JSON only.

### OUTPUT FORMAT
{
  "plan": {
    "meta": { 
      "subjects": ["${subjects.join('", "')}"], 
      "hoursPerDay": ${hours}, 
      "days": ${days}, 
      "goal": "${goal}" 
    },
    "days": [
      {
        "day": 1,
        "slots": [
          { "time": "09:00 - 10:00", "subject": "Maths", "topic": "Algebra" }
        ]
      }
    ]
  }
}
`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Timora AI, strict JSON-only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 3000,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await r.json();

    if (!data.choices || !data.choices[0]) {
      return res.json({ plan: null });
    }

    const content = data.choices[0].message.content;
    const parsed = safeJSON(content);

    if (!parsed || !parsed.plan) {
      console.log("INVALID JSON FROM AI:", content);
      return res.json({ plan: null });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: "AI request failed" });
  }
}
