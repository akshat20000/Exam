const express = require("express");
require("dotenv").config();

// Safe fetch for Node
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// Accept raw text (no JSON issues)
app.use(express.text({ type: "*/*" }));

app.post("/ask", async (req, res) => {
  const prompt = `
You are a senior Node.js backend engineer.

STRICT OUTPUT RULES:
- Output ONLY valid JavaScript code.
- Use Express.js only.
- Do NOT output JSON.
- Do NOT output Python or any other language.
- Do NOT explain anything.
- Do NOT include markdown.
- Do NOT include comments unless required in code.
- Do NOT wrap the code in quotes.
- The output must start with: const express
- The output must end with: app.listen(...)

TASK:
Write the COMPLETE and CORRECT Express.js backend code that satisfies the user story below in ONE response.

USER STORY:
${req.body}

${req.body}
`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "Answer concisely. No explanations." },
            { role: "user", content: prompt }
          ],
          temperature: 0,
          max_tokens: 900
        })
      }
    );

    const data = await response.json();

    // Optional debug (remove later)
    console.log("Groq response:", JSON.stringify(data, null, 2));

    if (!data.choices || data.choices.length === 0) {
      return res.status(400).json({
        error: "No response from Groq",
        raw: data
      });
    }

    res.type("text/plain").send(
      data.choices[0].message.content.trim()
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
