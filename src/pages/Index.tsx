import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FinalResults } from "@/components/FinalResults";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, Target, ArrowRight, Loader2 } from "lucide-react";

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
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
      setPhase("landing");
    }
  };

  const submitAnswer = async (answer: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("hr-interview", {
        body: {
          action: "evaluate",
          answer,
          question: questions[currentQ],
          questionNumber: currentQ + 1,
        },
      });
      if (error) throw error;
      setCurrentEval(data.evaluation);
      setPhase("feedback");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to evaluate your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentEval) {
      setEvaluations((prev) => [...prev, currentEval]);
    }
    if (currentQ + 1 >= questions.length) {
      setPhase("results");
    } else {
      setCurrentQ((prev) => prev + 1);
      setCurrentEval(null);
      setPhase("question");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground text-xs font-display font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Gemini 2.5 Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            HR Interview <span className="text-gradient">Practice</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Master behavioral questions with real-time AI feedback using the STAR method
          </p>
        </header>

        {/* Landing */}
        {phase === "landing" && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Brain, title: "AI Analysis", desc: "Gemini 2.5 Pro evaluates your answers in real-time" },
                { icon: Target, title: "STAR Method", desc: "Structured feedback on Situation, Task, Action, Result" },
                { icon: Sparkles, title: "5 Questions", desc: "Randomized behavioral questions from diverse categories" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="gradient-card rounded-xl border border-border p-5 shadow-card text-center">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
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

        {/* Question */}
        {phase === "question" && questions[currentQ] && (
          <QuestionCard
            question={questions[currentQ]}
            questionNumber={currentQ + 1}
            totalQuestions={questions.length}
            onSubmit={submitAnswer}
            isLoading={isLoading}
          />
        )}

        {/* Feedback */}
        {phase === "feedback" && currentEval && (
          <FeedbackCard
            evaluation={currentEval}
            questionNumber={currentQ + 1}
            totalQuestions={questions.length}
            onNext={nextQuestion}
          />
        )}

        {/* Final Results */}
        {phase === "results" && (
          <FinalResults
            evaluations={currentEval ? [...evaluations, currentEval] : evaluations}
            questions={questions}
            onRestart={() => {
              setPhase("landing");
              setCurrentEval(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
