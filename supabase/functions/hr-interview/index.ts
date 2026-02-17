import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HR_QUESTIONS = [
  "Tell me about a time when you had to deal with a difficult coworker or team member. How did you handle the situation?",
  "Describe a situation where you had to meet a tight deadline. What steps did you take to ensure you met it?",
  "Give me an example of a time when you showed leadership, even if you weren't in a formal leadership role.",
  "Tell me about a time when you failed at something. What did you learn from the experience?",
  "Describe a situation where you had to adapt to a significant change at work. How did you manage it?",
  "Tell me about a time you had to persuade someone to see things your way. What approach did you use?",
  "Give an example of a goal you set and how you achieved it.",
  "Describe a time when you went above and beyond what was expected of you.",
  "Tell me about a conflict you had with your manager. How did you resolve it?",
  "Describe a situation where you had to make a decision with incomplete information.",
];

function getRandomQuestions(count: number): string[] {
  const shuffled = [...HR_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, answer, question, questionNumber } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "get_questions") {
      const questions = getRandomQuestions(5);
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "evaluate") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
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
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ evaluation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("hr-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
