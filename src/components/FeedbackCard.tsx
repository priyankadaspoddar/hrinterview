import { StarBadge } from "./StarBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";

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

interface FeedbackCardProps {
  evaluation: Evaluation;
  questionNumber: number;
  totalQuestions: number;
  onNext: () => void;
}

const getScoreLabel = (score: number) => {
  if (score >= 9) return "Exceptional";
  if (score >= 7) return "Strong";
  if (score >= 5) return "Developing";
  return "Needs Work";
};

export const FeedbackCard = ({
  evaluation,
  questionNumber,
  totalQuestions,
  onNext,
}: FeedbackCardProps) => {
  const isLast = questionNumber >= totalQuestions;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Overall Score */}
      <div className="gradient-card rounded-xl border border-border p-6 md:p-8 shadow-card text-center">
        <p className="text-muted-foreground text-sm mb-2 font-display uppercase tracking-wider">
          Overall Score
        </p>
        <div className="text-6xl font-display font-bold text-gradient mb-1">
          {evaluation.overallScore}/10
        </div>
        <p className="text-primary font-semibold font-display">
          {getScoreLabel(evaluation.overallScore)}
        </p>
      </div>

      {/* STAR Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StarBadge
          label="Situation"
          score={evaluation.starBreakdown.situation.score}
          feedback={evaluation.starBreakdown.situation.feedback}
          delay={100}
        />
        <StarBadge
          label="Task"
          score={evaluation.starBreakdown.task.score}
          feedback={evaluation.starBreakdown.task.feedback}
          delay={200}
        />
        <StarBadge
          label="Action"
          score={evaluation.starBreakdown.action.score}
          feedback={evaluation.starBreakdown.action.feedback}
          delay={300}
        />
        <StarBadge
          label="Result"
          score={evaluation.starBreakdown.result.score}
          feedback={evaluation.starBreakdown.result.feedback}
          delay={400}
        />
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gradient-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-success" />
            <h3 className="font-display font-semibold text-foreground">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {evaluation.strengths.map((s, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-success mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="gradient-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-display font-semibold text-foreground">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {evaluation.improvements.map((s, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Improved Answer */}
      <div className="gradient-card rounded-xl border border-primary/20 p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Suggested Improvement</h3>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed italic">
          "{evaluation.improvedAnswer}"
        </p>
      </div>

      {/* Next Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onNext}
          className="gradient-primary text-primary-foreground font-display font-semibold px-8 py-6 text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
        >
          {isLast ? "View Final Results" : "Next Question"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
