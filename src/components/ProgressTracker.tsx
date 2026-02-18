import { TrendingUp } from "lucide-react";

const defaultCategories = [
  "Adaptability",
  "Conflict Resolution",
  "Career Goals",
  "Team Collaboration",
  "Culture Fit",
];

interface ProgressTrackerProps {
  currentQ: number;
  totalQuestions: number;
  categories?: string[];
}

export const ProgressTracker = ({ currentQ, totalQuestions, categories: catsProp }: ProgressTrackerProps) => {
  const categories = catsProp?.length ? catsProp.slice(0, totalQuestions) : defaultCategories.slice(0, totalQuestions);
  return (
    <div className="gradient-card rounded-xl border border-border p-4 shadow-card">
      <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        Progress
      </h3>
      <div className="space-y-2">
        {categories.map((cat, i) => {
          const done = i < currentQ;
          const active = i === currentQ;
          return (
            <div key={cat} className="flex items-center gap-2.5">
              <div
                className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                  done
                    ? "bg-success"
                    : active
                    ? "bg-primary animate-pulse"
                    : "bg-muted-foreground/30"
                }`}
              />
              <span
                className={`text-xs font-display transition-colors ${
                  done
                    ? "text-success font-semibold"
                    : active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {cat}
              </span>
              {done && (
                <span className="text-[10px] text-success ml-auto">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
