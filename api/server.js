import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------- SAFE JSON PARSER ----------
function safeJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

app.post("/api/generate-plan", async (req, res) => {
  const { subjects, hours, days, goal } = req.body;

  if (!subjects || !subjects.length) {
    return res.status(400).json({ error: "Subjects missing" });
  }

  // ----- SMART PROMPT -----
  const prompt = `
You are Timora AI, a professional study schedule generator.

### USER INPUT
Subjects: ${subjects.join(", ")}
Daily Study Limit: ${hours} hours
Total Days: ${days}
Goal: ${goal}

### RULES (FOLLOW STRICTLY)
1. **Total study hours per day MUST NOT exceed ${hours}.**
2. Each study block is MAX **1 hour**.
3. After EVERY study block, insert a **10–15 min micro break**.
4. After **3–4 study blocks**, insert a **30–60 min long break**.
5. Every day MUST include:
   - Breakfast
   - Lunch
   - Dinner
   - 1 Free Time / Relax slot
6. Allowed break labels: 
   "Break", "Rest", "Free Time", "Snack Break", "Nap", "Stretching", "Walk", 
   "Lunch", "Dinner", "Breakfast"
7. **Never exceed the user's ${hours}h study limit**.
8. The remaining time in the day SHOULD BE BREAKS, not extra study.
9. Return ONLY VALID JSON. No comments, no markdown.

### OUTPUT FORMAT (MANDATORY)
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
Strict valid JSON only. No backticks. No explanations.
  `;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Timora AI, a strict JSON-only study planner." },
          { role: "user", content: prompt },
        ],
        max_tokens: 3000,
        temperature: 0.3,
        response_format: { type: "json_object" } // 🟩 GUARANTEES VALID JSON
      }),
    });

    const data = await r.json();

    // Safety checks
    if (!data.choices || !data.choices[0]) {
      return res.json({ plan: null });
    }

    const content = data.choices[0].message.content;

    const parsed = safeJSON(content);

    if (!parsed || !parsed.plan) {
      console.log("INVALID JSON FROM AI:", content);
      return res.json({ plan: null });
    }

    return res.json(parsed);

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: "AI request failed" });
  }
});

app.listen(8080, () => {
  console.log("AI Planner API running on :8080");
});
