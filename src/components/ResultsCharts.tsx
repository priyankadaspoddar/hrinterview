import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, AreaChart, Area,
} from "recharts";

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

interface ResultsChartsProps {
  evaluations: Evaluation[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

const BAR_COLORS = ["#a855f7", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

export const ResultsCharts = ({ evaluations }: ResultsChartsProps) => {
  // STAR radar data
  const avgStar = {
    Situation: evaluations.reduce((s, e) => s + e.starBreakdown.situation.score, 0) / evaluations.length,
    Task: evaluations.reduce((s, e) => s + e.starBreakdown.task.score, 0) / evaluations.length,
    Action: evaluations.reduce((s, e) => s + e.starBreakdown.action.score, 0) / evaluations.length,
    Result: evaluations.reduce((s, e) => s + e.starBreakdown.result.score, 0) / evaluations.length,
  };

  const radarData = Object.entries(avgStar).map(([key, value]) => ({
    subject: key,
    score: parseFloat(value.toFixed(1)),
    fullMark: 10,
  }));

  // Per-question bar data
  const barData = evaluations.map((e, i) => ({
    name: `Q${i + 1}`,
    Score: e.overallScore,
    S: e.starBreakdown.situation.score,
    T: e.starBreakdown.task.score,
    A: e.starBreakdown.action.score,
    R: e.starBreakdown.result.score,
  }));

  // Progress trend
  const trendData = evaluations.map((e, i) => ({
    question: `Q${i + 1}`,
    score: e.overallScore,
  }));

  return (
    <div className="space-y-6">
      {/* STAR Radar Chart */}
      <div className="gradient-card rounded-xl border border-border p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 text-center">
          🎯 STAR Method Proficiency Radar
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-question Grouped Bar */}
      <div className="gradient-card rounded-xl border border-border p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 text-center">
          📊 Per-Question STAR Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="S" name="Situation" fill="#a855f7" radius={[2, 2, 0, 0]} />
            <Bar dataKey="T" name="Task" fill="#06b6d4" radius={[2, 2, 0, 0]} />
            <Bar dataKey="A" name="Action" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="R" name="Result" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Trend Area Chart */}
      <div className="gradient-card rounded-xl border border-border p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 text-center">
          📈 Performance Trend
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="question" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#a855f7"
              fill="url(#scoreGradient)"
              strokeWidth={2}
              dot={{ fill: "#a855f7", r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Track how your scores improve across questions — upward trends show adaptation!
        </p>
      </div>

      {/* Motivational Message */}
      <div className="gradient-card rounded-xl border border-primary/30 p-5 shadow-card text-center glow-primary">
        <p className="text-2xl mb-2">🔥</p>
        <p className="font-display font-semibold text-foreground text-sm">
          {evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length >= 7
            ? "Outstanding! You're interview-ready. Keep this momentum going! 🚀"
            : evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length >= 5
            ? "Great progress! A few more practice rounds and you'll ace it! 💪"
            : "Every expert was once a beginner. Keep practicing — you're getting better! 🌱"}
        </p>
      </div>
    </div>
  );
};
