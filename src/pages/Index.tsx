import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FinalResults } from "@/components/FinalResults";
import { LiveCamera, LiveCameraHandle } from "@/components/LiveCamera";
import { RealTimeMetrics } from "@/components/RealTimeMetrics";
import { StarTips } from "@/components/StarTips";
import { ProgressTracker } from "@/components/ProgressTracker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, Target, ArrowRight, Loader2, Video, Mic } from "lucide-react";

type Phase = "landing" | "loading" | "question" | "feedback" | "results";

interface Evaluation {
  overallScore: number;
  starBreakdown: {
    situation: { score: number; feedback: string };
    task: { score: number; feedback: string };
    action: { score: number; feedback: string };
    result: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
}

const Index = () => {
  const [phase, setPhase] = useState<Phase>("landing");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentEval, setCurrentEval] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const cameraRef = useRef<LiveCameraHandle>(null);
  const { toast } = useToast();

  const startInterview = async () => {
    setPhase("loading");
    try {
      const { data, error } = await supabase.functions.invoke("hr-interview", {
        body: { action: "get_questions" },
      });
      if (error) throw error;
      setQuestions(data.questions);
      setCurrentQ(0);
      setEvaluations([]);
      setCurrentEval(null);
      setPhase("question");
    } catch {
      toast({ title: "Error", description: "Failed to load questions.", variant: "destructive" });
      setPhase("landing");
    }
  };

  const submitAnswer = async (answer: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("hr-interview", {
        body: { action: "evaluate", answer, question: questions[currentQ], questionNumber: currentQ + 1 },
      });
      if (error) throw error;
      setCurrentEval(data.evaluation);
      setPhase("feedback");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to evaluate.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentEval) setEvaluations((prev) => [...prev, currentEval]);
    if (currentQ + 1 >= questions.length) {
      setPhase("results");
    } else {
      setCurrentQ((prev) => prev + 1);
      setCurrentEval(null);
      setPhase("question");
    }
  };

  const isInterviewActive = phase === "question" || phase === "feedback";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-6 px-4">
          <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground text-xs font-display font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Gemini 2.5 Pro
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            HR Interview <span className="text-gradient">Practice</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Master behavioral questions with real-time AI feedback using the STAR method
          </p>
        </header>

        {/* Landing */}
        {phase === "landing" && (
          <div className="max-w-3xl mx-auto px-4 space-y-8 animate-fade-in-up pb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: Brain, title: "AI Analysis", desc: "Gemini 2.5 Pro evaluates your answers" },
                { icon: Target, title: "STAR Method", desc: "Situation, Task, Action, Result" },
                { icon: Video, title: "Live Camera", desc: "Real video interview simulation" },
                { icon: Mic, title: "Voice Input", desc: "Speak your answers naturally" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="gradient-card rounded-xl border border-border p-4 shadow-card text-center">
                  <Icon className="h-7 w-7 text-primary mx-auto mb-2" />
                  <h3 className="font-display font-semibold text-foreground text-sm mb-0.5">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Button
                onClick={startInterview}
                className="gradient-primary text-primary-foreground font-display font-semibold px-10 py-6 text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
              >
                Start Interview
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-4 py-20 animate-fade-in-up">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-display">Preparing your interview...</p>
          </div>
        )}

        {/* Interview Active: 3-column layout */}
        {isInterviewActive && (
          <div className="max-w-7xl mx-auto px-4 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-4">
              {/* Left: Camera + Metrics */}
              <div className="space-y-4">
                <LiveCamera ref={cameraRef} />
                <RealTimeMetrics
                  videoRef={cameraRef.current?.videoRef || { current: null }}
                  isActive={cameraRef.current?.isActive || false}
                  isListening={isListening}
                />
              </div>

              {/* Center: Question/Feedback */}
              <div>
                {phase === "question" && questions[currentQ] && (
                  <QuestionCard
                    question={questions[currentQ]}
                    questionNumber={currentQ + 1}
                    totalQuestions={questions.length}
                    onSubmit={submitAnswer}
                    isLoading={isLoading}
                  />
                )}
                {phase === "feedback" && currentEval && (
                  <FeedbackCard
                    evaluation={currentEval}
                    questionNumber={currentQ + 1}
                    totalQuestions={questions.length}
                    onNext={nextQuestion}
                  />
                )}
              </div>

              {/* Right: STAR Tips + Progress */}
              <div className="space-y-4">
                <StarTips />
                <ProgressTracker currentQ={currentQ} totalQuestions={questions.length} />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === "results" && (
          <div className="max-w-3xl mx-auto px-4 pb-16">
            <FinalResults
              evaluations={currentEval ? [...evaluations, currentEval] : evaluations}
              questions={questions}
              onRestart={() => { setPhase("landing"); setCurrentEval(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
