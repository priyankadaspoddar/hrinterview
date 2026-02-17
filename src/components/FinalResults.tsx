import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, TrendingUp } from "lucide-react";

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

interface FinalResultsProps {
  evaluations: Evaluation[];
  questions: string[];
  onRestart: () => void;
}

export const FinalResults = ({ evaluations, questions, onRestart }: FinalResultsProps) => {
  const avgScore =
    evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length;

  const avgStar = {
    situation: evaluations.reduce((s, e) => s + e.starBreakdown.situation.score, 0) / evaluations.length,
    task: evaluations.reduce((s, e) => s + e.starBreakdown.task.score, 0) / evaluations.length,
    action: evaluations.reduce((s, e) => s + e.starBreakdown.action.score, 0) / evaluations.length,
    result: evaluations.reduce((s, e) => s + e.starBreakdown.result.score, 0) / evaluations.length,
  };

  const getGrade = (score: number) => {
    if (score >= 9) return "A+";
    if (score >= 8) return "A";
    if (score >= 7) return "B+";
    if (score >= 6) return "B";
    if (score >= 5) return "C";
    return "D";
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero Score */}
      <div className="gradient-card rounded-2xl border border-primary/30 p-8 md:p-12 shadow-card text-center glow-primary">
        <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground font-display uppercase tracking-wider text-sm mb-2">
          Interview Performance
        </p>
        <div className="text-7xl md:text-8xl font-display font-bold text-gradient mb-2">
          {avgScore.toFixed(1)}
        </div>
        <p className="text-2xl font-display font-semibold text-primary">
          Grade: {getGrade(avgScore)}
        </p>
      </div>

      {/* STAR Averages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["situation", "task", "action", "result"] as const).map((key) => (
          <div key={key} className="gradient-card rounded-xl border border-border p-4 text-center shadow-card">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1">
              {key}
            </p>
            <p className="text-2xl font-display font-bold text-foreground">
              {avgStar[key].toFixed(1)}
            </p>
          </div>
        ))}
      </div>

      {/* Per-question scores */}
      <div className="gradient-card rounded-xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Question Breakdown</h3>
        </div>
        <div className="space-y-3">
          {evaluations.map((e, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs font-display font-bold text-primary w-6">Q{i + 1}</span>
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-1000"
                  style={{ width: `${e.overallScore * 10}%` }}
                />
              </div>
              <span className="text-sm font-display font-semibold text-foreground w-10 text-right">
                {e.overallScore}/10
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={onRestart}
          className="gradient-primary text-primary-foreground font-display font-semibold px-8 py-6 text-lg hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Practice Again
        </Button>
      </div>
    </div>
  );
};
