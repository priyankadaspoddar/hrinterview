import { cn } from "@/lib/utils";

interface StarBadgeProps {
  label: string;
  score: number;
  feedback: string;
  delay?: number;
}

const getScoreColor = (score: number) => {
  if (score >= 8) return "text-success border-success/30 bg-success/10";
  if (score >= 5) return "text-warning border-warning/30 bg-warning/10";
  return "text-destructive border-destructive/30 bg-destructive/10";
};

export const StarBadge = ({ label, score, feedback, delay = 0 }: StarBadgeProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 animate-fade-in-up",
        getScoreColor(score)
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-semibold text-sm uppercase tracking-wider">
          {label}
        </span>
        <span className="font-display font-bold text-lg">{score}/10</span>
      </div>
      <p className="text-sm text-foreground/80">{feedback}</p>
    </div>
  );
};
