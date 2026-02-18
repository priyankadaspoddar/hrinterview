import { Eye, Activity, Hand, Smile, Mic, Brain, Heart, Zap, Shield } from "lucide-react";
import { EmotionMetrics } from "@/hooks/useEmotionTracking";

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  source?: string;
}

const MetricItem = ({ icon, label, value, source }: MetricItemProps) => {
  const getColor = (v: number) => {
    if (v >= 70) return "bg-success";
    if (v >= 40) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] font-display font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-display font-bold text-foreground">{value}%</span>
          {source && <span className="text-[8px] text-muted-foreground">{source}</span>}
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

interface RealTimeMetricsProps {
  metrics: EmotionMetrics;
}

export const RealTimeMetrics = ({ metrics }: RealTimeMetricsProps) => {
  const emotionEmoji: Record<string, string> = {
    happy: "😊", neutral: "😐", anxious: "😰", confident: "😎",
    focused: "🎯", distracted: "😶‍🌫️",
  };

  return (
    <div className="gradient-card rounded-xl border border-border p-3 shadow-card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-xs text-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Real-time Metrics
        </h3>
        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-display font-semibold">
          {emotionEmoji[metrics.dominantEmotion] || "😐"} {metrics.dominantEmotion}
        </span>
      </div>

      <MetricItem icon={<Eye className="h-3 w-3 text-primary" />} label="Eye Contact" value={metrics.eyeContact} source="MP+AI" />
      <MetricItem icon={<Shield className="h-3 w-3 text-accent" />} label="Posture" value={metrics.posture} source="Fused" />
      <MetricItem icon={<Hand className="h-3 w-3 text-warning" />} label="Body Language" value={metrics.bodyLanguage} source="Sim" />
      <MetricItem icon={<Smile className="h-3 w-3 text-success" />} label="Expression" value={metrics.expression} source="Fused" />
      <MetricItem icon={<Mic className="h-3 w-3 text-destructive" />} label="Voice Clarity" value={metrics.voiceClarity} source="YIN" />
      <MetricItem icon={<Brain className="h-3 w-3 text-primary" />} label="Confidence" value={metrics.confidence} source="AI" />
      <MetricItem icon={<Zap className="h-3 w-3 text-warning" />} label="Engagement" value={metrics.engagement} source="AI" />
      <MetricItem icon={<Heart className="h-3 w-3 text-destructive" />} label="Stress" value={metrics.stress} source="AI" />

      <p className="text-[8px] text-muted-foreground pt-1 border-t border-border">
        MP = MediaPipe · AI = Gemini Vision · Fused = 70/30 · EMA smoothed
      </p>
    </div>
  );
};
