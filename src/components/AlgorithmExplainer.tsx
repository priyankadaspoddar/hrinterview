import { useState } from "react";
import { Brain, Eye, Mic, Zap, Server, Cpu, BarChart3, Layers, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface StepProps {
  icon: React.ReactNode;
  title: string;
  tag: string;
  bullets: { point: string; detail: string }[];
  defaultOpen?: boolean;
}

const AlgorithmStep = ({ icon, title, tag, bullets, defaultOpen = false }: StepProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
          <div className="flex-1 text-left">
            <p className="font-display font-semibold text-foreground text-sm">{title}</p>
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-display font-semibold">{tag}</span>
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-12 pb-4 pr-3 space-y-3 animate-fade-in-up">
          {bullets.map((b, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <p className="text-sm font-display font-semibold text-foreground">{b.point}</p>
              </div>
              <p className="text-sm text-muted-foreground ml-4 leading-relaxed">{b.detail}</p>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const steps: Omit<StepProps, "defaultOpen">[] = [
  {
    icon: <Layers className="h-5 w-5" />,
    title: "Full Pipeline Overview",
    tag: "Architecture",
    bullets: [
      {
        point: "Multi-source real-time fusion pipeline",
        detail: "The system orchestrates 3 AI models and 1 local ML model running simultaneously. Your browser camera feeds both MediaPipe (locally at 60fps) and Gemini 2.5 Pro Vision (remotely every 8 seconds). These two data streams are fused using a weighted algorithm and smoothed before rendering in the UI.",
      },
      {
        point: "Voice and text dual input",
        detail: "The Web Speech API captures your voice continuously and streams interim transcripts to the answer box. When you submit, both your text answer and the current question are sent to Gemini 3 Flash for structured STAR evaluation — scoring Situation, Task, Action, and Result independently.",
      },
      {
        point: "End-to-end AI report generation",
        detail: "After all questions are answered, the complete session data — evaluations, emotion timeline, and STAR scores — is synthesized by Gemini 3 Flash into a structured JSON report, which is then rendered into a downloadable multi-page PDF using jsPDF.",
      },
    ],
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "MediaPipe Face Landmarker",
    tag: "Local ML · 60fps",
    bullets: [
      {
        point: "Runs entirely in your browser via WebAssembly + GPU",
        detail: "MediaPipe's FaceLandmarker model is loaded once and runs in VIDEO mode. It processes every frame from your webcam without sending any data to a server, ensuring zero-latency facial analysis with complete privacy for local processing.",
      },
      {
        point: "Extracts head orientation from a 4×4 transformation matrix",
        detail: "The model outputs a facial transformation matrix. From this, we compute yaw (left-right rotation) as atan2(matrix[8], matrix[10]) and pitch (up-down tilt) as asin(-matrix[9]). These angles tell us exactly where you're looking and how your head is positioned.",
      },
      {
        point: "Converts angles to Eye Contact, Posture, and Expression scores",
        detail: "Eye Contact is calculated as 100 minus a penalty of 3× yaw and 3× pitch — so looking straight at the camera gives ~100%. Posture uses a gentler 2× yaw penalty from a baseline of 85. Expression combines pitch deviation with a small random factor to simulate natural expression variability.",
      },
      {
        point: "Graceful decay when no face is detected",
        detail: "If the model can't find a face (e.g., you look away), scores don't instantly drop to zero. Instead, they decay gradually — eye contact by 5 points per frame, posture by 3, expression by 2. This prevents jarring UI jumps when you briefly glance away.",
      },
    ],
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "Gemini 2.5 Pro Vision Analysis",
    tag: "Cloud AI · Every 8s",
    bullets: [
      {
        point: "Captures a low-res webcam frame every 8 seconds",
        detail: "A 320×240 pixel JPEG frame is captured from the video element at 60% quality compression. This keeps the payload small (~15-20KB) while retaining enough visual detail for the AI to analyze your facial expressions, body posture, and overall demeanor.",
      },
      {
        point: "Gemini acts as a professional behavioral analyst",
        detail: "The frame is sent to Gemini 2.5 Pro's multimodal endpoint with a system prompt instructing it to act as an expert interview behavioral analyst. It returns structured JSON with confidence (0-100), engagement (0-100), stress (0-100), positivity (0-100), and a dominant emotion label.",
      },
      {
        point: "Adds semantic understanding that local ML can't provide",
        detail: "While MediaPipe can measure where your head is pointing, Gemini understands context — it can tell if you look confident vs. nervous, engaged vs. distracted, or stressed vs. calm. This semantic layer is what makes the analysis feel human-like rather than purely geometric.",
      },
    ],
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "70/30 Sensor Fusion",
    tag: "Core Algorithm",
    bullets: [
      {
        point: "Weighted blend: 70% local MediaPipe + 30% Gemini Vision",
        detail: "Where both systems produce overlapping metrics (eye contact, expression, posture), they're combined as: fused = 0.7 × local + 0.3 × remote. This weighting prioritizes the high-frequency local data (60fps) while enriching it with Gemini's semantic understanding (0.125fps).",
      },
      {
        point: "Why not 50/50?",
        detail: "Local data runs at 480× the frequency of remote data. If weighted equally, the UI would appear laggy — updating meaningfully only every 8 seconds when new Gemini data arrives. The 70/30 split keeps the UI responsive to real-time head movements while still incorporating AI insights.",
      },
      {
        point: "Non-overlapping metrics pass through directly",
        detail: "Confidence, engagement, and stress come only from Gemini (local ML can't infer these from geometry alone). Body language is simulated with a random walk algorithm. Voice clarity is derived from the microphone state. These bypass fusion and go straight to EMA smoothing.",
      },
    ],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Exponential Moving Average (EMA)",
    tag: "Smoothing · α=0.3",
    bullets: [
      {
        point: "Formula: smoothed = 0.3 × new + 0.7 × previous",
        detail: "Every 1.5 seconds, all 9 metrics pass through EMA smoothing. The alpha value of 0.3 means each new reading contributes 30% to the displayed value, while the previous smoothed value contributes 70%. This creates a gentle, natural-looking animation.",
      },
      {
        point: "Prevents UI jitter from noisy sensor data",
        detail: "Raw MediaPipe readings can fluctuate by 20-30 points between frames due to lighting changes, micro-movements, or detection noise. Without smoothing, the progress bars would jitter constantly. EMA filters out this noise while still responding to genuine changes within 3-4 seconds.",
      },
      {
        point: "Balances responsiveness vs. visual comfort",
        detail: "A lower alpha (e.g., 0.1) would be smoother but sluggish — taking 10+ seconds to reflect real changes. A higher alpha (e.g., 0.8) would be snappy but jittery. The chosen 0.3 reaches 90% of a new value in about 6 seconds — fast enough to feel real-time, smooth enough to look polished.",
      },
    ],
  },
  {
    icon: <Mic className="h-5 w-5" />,
    title: "Speech Recognition & Voice Clarity",
    tag: "Web Speech API",
    bullets: [
      {
        point: "Continuous real-time transcription with interim results",
        detail: "The browser's webkitSpeechRecognition API runs in continuous mode with interimResults enabled. This means you see your words appear in the text box as you speak them, even before the speech engine finalizes the transcription. Final results are appended to your answer.",
      },
      {
        point: "Voice clarity score tracks speaking activity",
        detail: "When the microphone is active and you're speaking, the voice clarity score gradually increases (biased upward by +14, -6 random walk). When you stop speaking, it decays by 5 points per tick. This simulates clarity tracking — active, articulate speakers score higher.",
      },
    ],
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "STAR Method Evaluation",
    tag: "Gemini 3 Flash",
    bullets: [
      {
        point: "AI scores each STAR component independently (1-10)",
        detail: "Your answer is sent to Gemini 3 Flash Preview with a structured prompt. The AI evaluates Situation (context clarity), Task (role definition), Action (steps taken), and Result (outcomes achieved) independently. Each gets a numeric score and written feedback explaining the rating.",
      },
      {
        point: "Generates strengths, improvements, and a model answer",
        detail: "Beyond scoring, the AI identifies your top strengths (what you did well), specific areas for improvement (what to add or change), and provides a complete improved answer showing how an ideal response would sound. This gives you a concrete learning target.",
      },
      {
        point: "Prompted as a senior HR interviewer with 15+ years experience",
        detail: "The system prompt establishes the AI as an experienced HR professional, ensuring feedback is practical and industry-relevant rather than generic. It evaluates answers the way a real interviewer would — looking for specificity, metrics, and structured storytelling.",
      },
    ],
  },
  {
    icon: <Server className="h-5 w-5" />,
    title: "PDF Report Generation",
    tag: "Gemini 3 Flash + jsPDF",
    bullets: [
      {
        point: "AI synthesizes all session data into a structured report",
        detail: "All evaluations, emotion timeline averages, and STAR scores are sent to Gemini 3 Flash, which generates a comprehensive JSON report including executive summary, overall assessment, STAR proficiency analysis, communication analysis, emotional intelligence insights, and actionable recommendations.",
      },
      {
        point: "jsPDF renders the report as a multi-page downloadable PDF",
        detail: "The AI-generated JSON is parsed and rendered into a styled PDF with a dark header, section dividers, question-by-question breakdowns, and a footer. Text is automatically wrapped and paginated, so long reports flow naturally across multiple pages.",
      },
    ],
  },
];

export const AlgorithmExplainer = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground text-xs font-display font-semibold px-4 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5" />
          Technical Deep-Dive
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          How the <span className="text-gradient">Algorithm</span> Works
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Tap each section to explore the AI systems powering your interview analysis.
        </p>
      </div>

      <div className="gradient-card rounded-xl border border-border shadow-card divide-y divide-border">
        {steps.map((step, i) => (
          <AlgorithmStep key={i} {...step} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
};
