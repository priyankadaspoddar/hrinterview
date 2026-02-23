import { useState } from "react";
import { Brain, Eye, Mic, Zap, Server, Cpu, BarChart3, Layers, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface StepProps {
  icon: React.ReactNode;
  title: string;
  tag: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AlgorithmStep = ({ icon, title, tag, children, defaultOpen = false }: StepProps) => {
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
        <div className="ml-12 pb-4 pr-3 text-sm text-muted-foreground space-y-2 animate-fade-in-up">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-muted/80 rounded-lg p-3 text-[11px] font-mono text-foreground overflow-x-auto border border-border">
    {children}
  </pre>
);

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
          An interactive breakdown of every AI system powering your interview analysis.
        </p>
      </div>

      <div className="gradient-card rounded-xl border border-border shadow-card divide-y divide-border">
        {/* Pipeline overview */}
        <AlgorithmStep
          icon={<Layers className="h-5 w-5" />}
          title="Full Pipeline Overview"
          tag="Architecture"
          defaultOpen
        >
          <p>The system orchestrates <strong>3 AI models + 1 local ML model</strong> in a real-time fusion pipeline:</p>
          <CodeBlock>{`Browser Camera → MediaPipe (local, 60fps)
                    ↘
                     → 70/30 Fusion → EMA Smoothing → UI
                    ↗
Browser Camera → Gemini 2.5 Pro Vision (remote, every 8s)

Voice Input → Web Speech API → Transcript
Transcript + Question → Gemini 3 Flash → STAR Evaluation`}</CodeBlock>
        </AlgorithmStep>

        {/* MediaPipe */}
        <AlgorithmStep
          icon={<Eye className="h-5 w-5" />}
          title="MediaPipe Face Landmarker"
          tag="Local ML · 60fps"
        >
          <p>Runs <strong>entirely in your browser</strong> using WebAssembly + GPU. Extracts a 4×4 facial transformation matrix every frame.</p>
          <CodeBlock>{`// Extract yaw & pitch from the transformation matrix
yaw = |atan2(matrix[8], matrix[10])| × (180/π)
pitch = |asin(-matrix[9])| × (180/π)

// Convert to scores (0-100)
eyeContact = clamp(100 - yaw×3 - pitch×3, 0, 100)
posture     = clamp(85 - yaw×2, 0, 100)
expression  = clamp(75 + random(0,15) - pitch, 0, 100)`}</CodeBlock>
          <p>When no face is detected, scores decay gradually: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">eyeContact -= 5</code> per frame to avoid sudden drops.</p>
        </AlgorithmStep>

        {/* Gemini Vision */}
        <AlgorithmStep
          icon={<Brain className="h-5 w-5" />}
          title="Gemini 2.5 Pro Vision Analysis"
          tag="Cloud AI · Every 8s"
        >
          <p>Every 8 seconds, a <strong>320×240 JPEG frame</strong> is captured and sent to Gemini 2.5 Pro's multimodal endpoint.</p>
          <CodeBlock>{`// Capture frame as base64
canvas.drawImage(video, 0, 0, 320, 240)
base64 = canvas.toDataURL("image/jpeg", 0.6)

// Gemini analyzes for:
{
  confidence: 0-100,      // Body posture + facial cues
  engagement: 0-100,      // Active participation signals
  stress: 0-100,          // Tension indicators
  positivity: 0-100,      // Emotional valence
  dominantEmotion: "confident" | "anxious" | ...
}`}</CodeBlock>
          <p>The AI prompt instructs Gemini to act as a professional interview behavioral analyst with structured JSON output.</p>
        </AlgorithmStep>

        {/* Fusion Algorithm */}
        <AlgorithmStep
          icon={<Cpu className="h-5 w-5" />}
          title="70/30 Sensor Fusion"
          tag="Core Algorithm"
        >
          <p>Where both MediaPipe and Gemini produce overlapping metrics, they're fused with a <strong>70% local / 30% cloud</strong> weighting:</p>
          <CodeBlock>{`fuse(local, remote) = 0.7 × local + 0.3 × remote

// Applied to overlapping metrics:
fusedEyeContact = fuse(mediapipe.eye, gemini.eye)
fusedExpression = fuse(mediapipe.expression, gemini.positivity)
fusedPosture    = fuse(mediapipe.posture, gemini.presence)`}</CodeBlock>
          <p><strong>Why 70/30?</strong> Local runs at 60fps (high temporal resolution) vs. cloud at 0.125fps. Local data is more responsive; cloud data adds semantic understanding.</p>
        </AlgorithmStep>

        {/* EMA Smoothing */}
        <AlgorithmStep
          icon={<BarChart3 className="h-5 w-5" />}
          title="Exponential Moving Average (EMA)"
          tag="Smoothing · α=0.3"
        >
          <p>All 9 metrics pass through EMA smoothing to prevent UI jitter:</p>
          <CodeBlock>{`// EMA formula (α = 0.3)
smoothed = α × newValue + (1-α) × previousValue
smoothed = 0.3 × new + 0.7 × previous

// Example: eye contact jumps from 40 to 90
Frame 1: 0.3×90 + 0.7×40 = 55
Frame 2: 0.3×90 + 0.7×55 = 65.5
Frame 3: 0.3×90 + 0.7×65.5 = 72.9
// Gradual ramp instead of jarring jump`}</CodeBlock>
          <p>Lower α = smoother (more lag). Higher α = more responsive (more jitter). <strong>0.3 balances responsiveness with visual comfort.</strong></p>
        </AlgorithmStep>

        {/* Voice */}
        <AlgorithmStep
          icon={<Mic className="h-5 w-5" />}
          title="Speech Recognition & Voice Clarity"
          tag="Web Speech API"
        >
          <p>Uses the browser's <code className="text-xs bg-muted px-1.5 py-0.5 rounded">webkitSpeechRecognition</code> with continuous mode:</p>
          <CodeBlock>{`// Voice clarity algorithm
if (isListening) {
  voiceClarity += random(-6, +14)  // Biased upward
  voiceClarity = clamp(voiceClarity, 30, 100)
} else {
  voiceClarity -= 5  // Decay when silent
}`}</CodeBlock>
          <p>The transcript streams to the QuestionCard in real-time via <code className="text-xs bg-muted px-1.5 py-0.5 rounded">interimResults: true</code>.</p>
        </AlgorithmStep>

        {/* STAR Evaluation */}
        <AlgorithmStep
          icon={<Zap className="h-5 w-5" />}
          title="STAR Method Evaluation"
          tag="Gemini 3 Flash"
        >
          <p>Your answer is sent to <strong>Gemini 3 Flash Preview</strong> with a structured prompt that enforces STAR scoring:</p>
          <CodeBlock>{`// AI evaluates each STAR component (1-10):
{
  situation: { score: 8, feedback: "Clear context..." },
  task:      { score: 7, feedback: "Role defined..." },
  action:    { score: 9, feedback: "Detailed steps..." },
  result:    { score: 6, feedback: "Add metrics..." }
}
// + strengths[], improvements[], improvedAnswer`}</CodeBlock>
          <p>The model is prompted as a "senior HR interviewer with 15+ years experience" to ensure professional-grade feedback.</p>
        </AlgorithmStep>

        {/* Report Generation */}
        <AlgorithmStep
          icon={<Server className="h-5 w-5" />}
          title="PDF Report Generation"
          tag="Gemini 3 Flash + jsPDF"
        >
          <p>All session data (evaluations + emotion timeline) is sent to Gemini 3 Flash which produces a structured JSON report:</p>
          <CodeBlock>{`// Report sections generated by AI:
{
  executiveSummary: "...",
  overallAssessment: "...",
  starMethodProficiency: "...",
  communicationAnalysis: "...",
  emotionalIntelligence: "...",
  topStrengths: [...],
  developmentAreas: [...],
  actionableRecommendations: [...],
  predictedPerformance: "...",
  readinessLevel: "Interview Ready"
}`}</CodeBlock>
          <p>This JSON is then rendered into a multi-page PDF using <strong>jsPDF</strong> with custom styling and section headers.</p>
        </AlgorithmStep>
      </div>
    </div>
  );
};
