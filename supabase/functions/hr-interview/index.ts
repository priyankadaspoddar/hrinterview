import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://raw.githubusercontent.com/supabase/supabase-js/master/src/index.ts";

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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "http://localhost:54320",
  Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZGlyZWN0VXJsIjoiaHR0cDovL2xvY2FsaG9zdDo1NDMyMSJ9.1wHuMa_cKkOKQA3-ifK7uIMQZM1tyrabBrY7vWob8iU"
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ✅ Reads "gemini" secret from environment
    const GEMINI_API_KEY = Deno.env.get("gemini") || "AIzaSyB2wOZSVx8gucgQcHRjS8Eq302XPkP6EqM";
    if (!GEMINI_API_KEY) throw new Error("Gemini API key not found. Please set the 'gemini' environment variable.");

    // ✅ Call Gemini 1.5 Flash directly via native REST API
    const callAI = async (prompt: string) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        if (response.status === 429) throw { status: 429, message: "Rate limit exceeded. Please wait and try again." };
        if (response.status === 400) throw { status: 400, message: "Invalid API key or request." };
        if (response.status === 403) throw { status: 403, message: "API key invalid or quota exceeded." };
        throw { status: 500, message: `Gemini API error: ${response.status}` };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text;
    };

    // ─── Initialize interview session ───
    if (action === "start_interview") {
      const { userId } = body;
      const { data, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: userId,
          total_questions: 5,
          questions_answered: 0,
        })
        .select("*")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ sessionId: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Generate 5 diverse questions ───
    if (action === "get_questions") {
      const shuffled = [...QUESTION_CATEGORIES].sort(() => Math.random() - 0.5);
      const selectedCategories = shuffled.slice(0, 5);

      const prompt = `You are an expert HR interviewer. Generate exactly 5 behavioral interview questions, one for each of these categories: ${selectedCategories.join(", ")}.

Each question must:
- Be a behavioral "Tell me about a time..." style question
- Target the STAR method
- Be unique, realistic, and challenging

Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
{
  "questions": [
    { "question": "...", "category": "..." },
    { "question": "...", "category": "..." },
    { "question": "...", "category": "..." },
    { "question": "...", "category": "..." },
    { "question": "...", "category": "..." }
  ]
}`;

      const content = await callAI(prompt);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI questions");
      const parsed = JSON.parse(jsonMatch[0]);

      return new Response(
        JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          questions: parsed.questions.map((q: any) => q.question),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categories: parsed.questions.map((q: any) => q.category),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Evaluate answer with STAR analysis ───
    if (action === "evaluate") {
      const { answer, question, questionNumber, sessionId } = body;

      const prompt = `You are an expert HR interview coach. Evaluate the candidate's answer using the STAR method.

Question ${questionNumber}/5: "${question}"

Candidate's Answer: "${answer}"

Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
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
}`;

      const content = await callAI(prompt);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response");
      const evaluation = JSON.parse(jsonMatch[0]);

      // Store the answer in database
      await supabase
        .from("session_answers")
        .insert({
          session_id: sessionId,
          question: question,
          category: QUESTION_CATEGORIES[(questionNumber - 1) % QUESTION_CATEGORIES.length],
          score: evaluation.overallScore,
          star_scores: evaluation.starBreakdown,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          skipped: false,
        });

      // Update session progress
      await supabase
        .from("interview_sessions")
        .update({
          questions_answered: questionNumber,
          avg_score: evaluation.overallScore, // Temporary, will be updated later
        })
        .eq("id", sessionId);

      return new Response(JSON.stringify({ evaluation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Skip question ───
    if (action === "skip_question") {
      const { question, questionNumber, sessionId } = body;

      // Store the skipped answer
      await supabase
        .from("session_answers")
        .insert({
          session_id: sessionId,
          question: question,
          category: QUESTION_CATEGORIES[(questionNumber - 1) % QUESTION_CATEGORIES.length],
          score: null,
          star_scores: null,
          strengths: null,
          improvements: null,
          skipped: true,
        });

      // Update session progress
      await supabase
        .from("interview_sessions")
        .update({
          questions_answered: questionNumber,
        })
        .eq("id", sessionId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Get session progress ───
    if (action === "get_progress") {
      const { sessionId } = body;

      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: answersData, error: answersError } = await supabase
        .from("session_answers")
        .select("*")
        .eq("session_id", sessionId);

      if (answersError) throw answersError;

      // Calculate average score
      const totalScore = answersData.reduce((sum, answer) => sum + (answer.score || 0), 0);
      const answeredCount = answersData.filter(answer => answer.score !== null).length;
      const avgScore = answeredCount > 0 ? totalScore / answeredCount : 0;

      // Update session with actual average score
      await supabase
        .from("interview_sessions")
        .update({ avg_score: avgScore })
        .eq("id", sessionId);

      return new Response(JSON.stringify({
        progress: sessionData.questions_answered,
        totalQuestions: sessionData.total_questions,
        avgScore: avgScore,
        answers: answersData,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Vision-based emotion analysis ───
    if (action === "analyze_emotion") {
      const { frameBase64 } = body;
      if (!frameBase64) throw new Error("No frame provided");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Analyze this interview candidate's expression and body language. Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
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
                { inline_data: { mime_type: "image/jpeg", data: frameBase64 } },
              ],
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
          }),
        }
      );

      if (!response.ok) {
        const t = await response.text();
        console.error("Emotion analysis error:", response.status, t);
        throw { status: 500, message: "Emotion analysis failed" };
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse emotion data");
      const emotionData = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify({ emotionData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Generate PDF report ───
    if (action === "generate_report") {
      const { sessionId } = body;

      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: answersData, error: answersError } = await supabase
        .from("session_answers")
        .select("*")
        .eq("session_id", sessionId);

      if (answersError) throw answersError;

      const avgScore = sessionData.avg_score || 0;

      const prompt = `You are an expert HR interview report writer. Generate a comprehensive, professional interview performance report.

Interview Data:
Average Score: ${avgScore.toFixed(1)}/10

Questions & Scores:
${answersData
  .map((answer: any, i: number) =>
    `Q${i + 1} [${answer.category || "General"}]: "${answer.question}" → Score: ${answer.score || "N/A"}
  S:${answer.star_scores?.situation?.score || "N/A"} T:${answer.star_scores?.task?.score || "N/A"} A:${answer.star_scores?.action?.score || "N/A"} R:${answer.star_scores?.result?.score || "N/A"}
  Strengths: ${answer.strengths?.join(", ") || "N/A"}
  Improvements: ${answer.improvements?.join(", ") || "N/A"}`
  )
  .join("\n\n")}

Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
{
  "executiveSummary": "<2-3 sentence overview>",
  "overallAssessment": "<detailed paragraph>",
  "communicationAnalysis": "<paragraph>",
  "emotionalIntelligence": "<paragraph>",
  "starMethodProficiency": "<paragraph>",
  "topStrengths": ["<strength1>", "<strength2>", "<strength3>"],
  "developmentAreas": ["<area1>", "<area2>", "<area3>"],
  "actionableRecommendations": ["<rec1>", "<rec2>", "<rec3>", "<rec4>"],
  "readinessLevel": "<Not Ready|Developing|Interview Ready|Highly Prepared>",
  "predictedPerformance": "<paragraph>"
}`;

      const content = await callAI(prompt);
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