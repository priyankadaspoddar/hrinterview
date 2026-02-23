import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, ChevronRight, Calendar, Award } from "lucide-react";

interface Session {
  id: string;
  created_at: string;
  avg_score: number | null;
  total_questions: number;
  questions_answered: number;
}

interface SessionHistoryProps {
  onViewSession?: (sessionId: string) => void;
}

export const SessionHistory = ({ onViewSession }: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setSessions(data || []);
      setLoading(false);
    };
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="gradient-card rounded-xl border border-border p-5 shadow-card animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (sessions.length === 0) return null;

  const getGrade = (score: number) => {
    if (score >= 9) return "A+";
    if (score >= 8) return "A";
    if (score >= 7) return "B+";
    if (score >= 6) return "B";
    if (score >= 5) return "C";
    return "D";
  };

  return (
    <div className="gradient-card rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">Past Sessions</h3>
        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-display font-semibold ml-auto">
          {sessions.length} sessions
        </span>
      </div>

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer group"
            onClick={() => onViewSession?.(s.id)}
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Award className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-semibold text-foreground text-sm">
                  {s.avg_score != null ? `${Number(s.avg_score).toFixed(1)}/10` : "—"}
                </p>
                {s.avg_score != null && (
                  <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full font-display font-semibold">
                    {getGrade(Number(s.avg_score))}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(s.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
                <span className="mx-1">·</span>
                {s.questions_answered}/{s.total_questions} answered
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};
