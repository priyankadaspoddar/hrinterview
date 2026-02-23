import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QUESTION_CATEGORIES = [
  "Adaptability & Change Management",
  "Conflict Resolution & Interpersonal Skills",
  "Leadership & Initiative",
  "Problem Solving & Critical Thinking",
  "Teamwork & Collaboration",
  "Communication & Persuasion",
  "Time Management & Prioritization",
  "Resilience & Handling Failure",
  "Goal Setting & Achievement",
  "Customer Focus & Service",
  "Innovation & Creativity",
  "Ethics & Integrity",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ✅ Use "gemini" secret from Lovable
    const GEMINI_API_KEY = Deno.env.get("gemini");
    if (!GEMINI_API_KEY) throw new Error("gemini secret is not configured");

    // ✅ Gemini's OpenAI-compatible endpoint
    const GEMINI_BASE_URL =
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    const callAI = async (model: string, messages: any[], extraOpts: any = {}) => {
      const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, ...extraOpts }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw { status: 429, message: "Rate limit exceeded. Please wait a moment and try again." };
        }
        if (response.status === 402 || response.status === 403) {
          throw { status: 402, message: "Gemini API quota exceeded or key invalid." };
        }
        const t = await response.text();
        console.error("Gemini API error:", response.status, t);
        throw { status: 500, message: "Gemini API error" };
      }
      return response.json();
    };

    // ─── Generate 5 diverse questions via Gemini 2.5 Pro ───
    if (action === "get_questions") {
      const shuffled = [...QUESTION_CATEGORIES].sort(() => Math.random() - 0.5);
      const selectedCategories = shuffled.slice(0, 5);

      const data = await callAI("gemini-2.5-pro", [
        {
          role: "system",
          content: `You are an expert HR interviewer. Generate exactly 5 behavioral interview questions, one for each of these categories: ${selectedCategories.join(", ")}.

Each question must:
- Be a behavioral "Tell me about a time..." style question
- Target the STAR method
- Be unique, realistic, and challenging

Return ONLY a JSON object:
{
  "questions": [
    { "question": "...", "category": "..." }
  ]
}`,
        },
        { role: "user", content: "Generate the 5 interview questions now." },
      ]);

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI questions");
      const parsed = JSON.parse(jsonMatch[0]);

      return new Response(
        JSON.stringify({
          questions: parsed.questions.map((q: any) => q.question),
          categories: parsed.questions.map((q: any) => q.category),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Evaluate answer with STAR analysis (Gemini 2.0 Flash) ───
    if (action === "evaluate") {
      const { answer, question, questionNumber } = body;
      const data = await callAI("gemini-2.0-flash", [
        {
          role: "system",
          content: `You are an expert HR interview coach. Evaluate the candidate's answer using the STAR method (Situation, Task, Action, Result).

Provide your evaluation in the following JSON format:
{
  "overallScore": <number 1-10>,
  "starBreakdown": {
    "situation": { "score": <1-10>, "feedback": "<brief feedback>" },
    "task": { "score": <1-10>, "feedback": "<brief feedback>" },
    "action": { "score": <1-10>, "feedback": "<brief feedback>" },
    "result": { "score": <1-10>, "feedback": "<brief feedback>" }
  },
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "improvedAnswer": "<A brief example of how they could improve their answer>"
}

Be encouraging but honest. Focus on practical, actionable feedback.`,
        },
        {
          role: "user",
          content: `Question ${questionNumber}/5: "${question}"\n\nCandidate's Answer: "${answer}"`,
        },
      ]);

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response");
      const evaluation = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify({ evaluation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Vision-based emotion analysis (Gemini 2.0 Flash) ───
    if (action === "analyze_emotion") {
      const { frameBase64 } = body;
      if (!frameBase64) throw new Error("No frame provided");

      const data = await callAI("gemini-2.0-flash", [
        {
          role: "system",
          content: `You are an expert in facial expression and body language analysis for interview coaching.

Analyze the provided image of a person during a video interview.

Return ONLY a JSON object with scores from 0-100:
{
  "eyeContact": <0-100>,
  "confidence": <0-100>,
  "engagement": <0-100>,
  "stress": <0-100>,
  "positivity": <0-100>,
  "professionalPresence": <0-100>,
  "dominantEmotion": "<happy|neutral|anxious|confident|focused|distracted>",
  "microExpressions": "<brief observation>"
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this interview candidate's expression and body language:" },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${frameBase64}` },
            },
          ],
        },
      ]);

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse emotion data");
      const emotionData = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify({ emotionData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Generate PDF report (Gemini 2.0 Flash) ───
    if (action === "generate_report") {
      const { evaluations, questions, categories, emotionTimeline, overallEmotionAvg } = body;

      const avgScore =
        evaluations.reduce((s: number, e: any) => s + e.overallScore, 0) / evaluations.length;

      const data = await callAI("gemini-2.0-flash", [
        {
          role: "system",
          content: `You are an expert HR interview report writer. Generate a comprehensive, professional interview performance report.

Return a JSON object:
{
  "executiveSummary": "<2-3 sentence overview>",
  "overallAssessment": "<detailed paragraph about candidate's performance>",
  "communicationAnalysis": "<paragraph analyzing communication style, clarity, confidence>",
  "emotionalIntelligence": "<paragraph based on emotion tracking data>",
  "starMethodProficiency": "<paragraph evaluating STAR method usage>",
  "topStrengths": ["<strength1>", "<strength2>", "<strength3>"],
  "developmentAreas": ["<area1>", "<area2>", "<area3>"],
  "actionableRecommendations": ["<rec1>", "<rec2>", "<rec3>", "<rec4>"],
  "readinessLevel": "<Not Ready|Developing|Interview Ready|Highly Prepared>",
  "predictedPerformance": "<paragraph predicting real interview performance>"
}`,
        },
        {
          role: "user",
          content: `Interview Data:
Average Score: ${avgScore.toFixed(1)}/10

Questions & Scores:
${evaluations
  .map(
    (e: any, i: number) =>
      `Q${i + 1} [${categories?.[i] || "General"}]: "${questions[i]}" → Score: ${e.overallScore}/10
  S:${e.starBreakdown.situation.score} T:${e.starBreakdown.task.score} A:${e.starBreakdown.action.score} R:${e.starBreakdown.result.score}
  Strengths: ${e.strengths.join(", ")}
  Improvements: ${e.improvements.join(", ")}`
  )
  .join("\n\n")}

Emotion Tracking Summary:
${
  overallEmotionAvg
    ? `Eye Contact: ${overallEmotionAvg.eyeContact}%, Confidence: ${overallEmotionAvg.confidence}%, Engagement: ${overallEmotionAvg.engagement}%, Stress: ${overallEmotionAvg.stress}%, Positivity: ${overallEmotionAvg.positivity}%`
    : "No emotion data available"
}

Generate a thorough, professional HR interview report.`,
        },
      ]);

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse report");
      const report = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("hr-interview error:", e);
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
