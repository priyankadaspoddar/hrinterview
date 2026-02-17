import { Lightbulb } from "lucide-react";

const tips = [
  { letter: "S", title: "Set the scene", desc: "Describe the context" },
  { letter: "T", title: "Explain your specific responsibility", desc: "" },
  { letter: "A", title: "Detail the steps YOU took", desc: "" },
  { letter: "R", title: "Share measurable outcomes", desc: "" },
];

export const StarTips = () => (
  <div className="gradient-card rounded-xl border border-border p-4 shadow-card">
    <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
      <Lightbulb className="h-4 w-4 text-primary" />
      STAR Tips
    </h3>
    <div className="space-y-2.5">
      {tips.map(({ letter, title, desc }) => (
        <div key={letter} className="flex gap-2.5">
          <span className="gradient-primary text-primary-foreground font-display font-bold text-xs w-6 h-6 rounded-md flex items-center justify-center shrink-0">
            {letter}
          </span>
          <div>
            <p className="text-xs font-medium text-foreground leading-tight">{title}</p>
            {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
);
