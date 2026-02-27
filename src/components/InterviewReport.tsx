import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmotionMetrics } from "@/hooks/useEmotionTracking";
import jsPDF from "jspdf";

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

interface InterviewReportProps {
  evaluations: Evaluation[];
  questions: string[];
  categories: string[];
  emotionTimeline: EmotionMetrics[];
}

export const InterviewReport = ({ evaluations, questions, categories, emotionTimeline }: InterviewReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const getEmotionAvg = () => {
    if (emotionTimeline.length === 0) return null;
    const avg = (key: keyof EmotionMetrics) => {
      const vals = emotionTimeline.map(e => typeof e[key] === "number" ? e[key] as number : 0);
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };
    return {
      eyeContact: avg("eyeContact"),
      confidence: avg("confidence"),
      engagement: avg("engagement"),
      stress: avg("stress"),
      positivity: avg("positivity"),
    };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const emotionAvg = getEmotionAvg();

      const { data, error } = await supabase.functions.invoke("hr-interview", {
        body: {
          action: "generate_report",
          evaluations,
          questions,
          categories,
          emotionTimeline: emotionTimeline.slice(-10),
          overallEmotionAvg: emotionAvg,
        },
      });
      if (error) throw error;
      const report = data.report;

      const avgScore = evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length;

      // Build PDF
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const addText = (text: string, x: number, maxW: number, size = 10, style: "normal" | "bold" = "normal") => {
        doc.setFontSize(size);
        doc.setFont("helvetica", style);
        const lines = doc.splitTextToSize(text, maxW);
        if (y + lines.length * (size * 0.5) > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, x, y);
        y += lines.length * (size * 0.45) + 2;
      };

      const addSection = (title: string) => {
        y += 4;
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setDrawColor(147, 51, 234);
        doc.setLineWidth(0.5);
        doc.line(15, y, pageW - 15, y);
        y += 6;
        addText(title, 15, pageW - 30, 14, "bold");
        y += 2;
      };

      // Header
      doc.setFillColor(15, 14, 23);
      doc.rect(0, 0, pageW, 45, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("HR Interview Performance Report", pageW / 2, 18, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 28, { align: "center" });
      doc.text(`Overall Score: ${avgScore.toFixed(1)}/10 · Readiness: ${report.readinessLevel}`, pageW / 2, 36, { align: "center" });
      y = 55;
      doc.setTextColor(30, 30, 30);

      // Executive Summary
      addSection("Executive Summary");
      addText(report.executiveSummary, 15, pageW - 30, 11);

      // Overall Assessment
      addSection("Overall Assessment");
      addText(report.overallAssessment, 15, pageW - 30);

      // Per-Question Breakdown
      addSection("Question-by-Question Analysis");
      evaluations.forEach((e, i) => {
        addText(`Q${i + 1} [${categories[i] || "General"}] — Score: ${e.overallScore}/10`, 15, pageW - 30, 11, "bold");
        addText(`"${questions[i]}"`, 20, pageW - 35, 9);
        addText(`S: ${e.starBreakdown.situation.score}/10  T: ${e.starBreakdown.task.score}/10  A: ${e.starBreakdown.action.score}/10  R: ${e.starBreakdown.result.score}/10`, 20, pageW - 35, 9);
        addText(`Strengths: ${e.strengths.join("; ")}`, 20, pageW - 35, 9);
        addText(`Improve: ${e.improvements.join("; ")}`, 20, pageW - 35, 9);
        y += 3;
      });

      // STAR Method Proficiency
      addSection("STAR Method Proficiency");
      addText(report.starMethodProficiency, 15, pageW - 30);

      // Communication Analysis
      addSection("Communication Analysis");
      addText(report.communicationAnalysis, 15, pageW - 30);

      // Emotional Intelligence
      addSection("Emotional Intelligence & Body Language");
      addText(report.emotionalIntelligence, 15, pageW - 30);
      if (emotionAvg) {
        addText(`Avg Eye Contact: ${emotionAvg.eyeContact}% · Confidence: ${emotionAvg.confidence}% · Engagement: ${emotionAvg.engagement}% · Stress: ${emotionAvg.stress}% · Positivity: ${emotionAvg.positivity}%`, 15, pageW - 30, 9);
      }

      // Strengths & Development
      addSection("Top Strengths");
      report.topStrengths.forEach((s: string, i: number) => addText(`${i + 1}. ${s}`, 20, pageW - 35));

      addSection("Development Areas");
      report.developmentAreas.forEach((a: string, i: number) => addText(`${i + 1}. ${a}`, 20, pageW - 35));

      // Recommendations
      addSection("Actionable Recommendations");
      report.actionableRecommendations.forEach((r: string, i: number) => addText(`${i + 1}. ${r}`, 20, pageW - 35));

      // Predicted Performance
      addSection("Predicted Real Interview Performance");
      addText(report.predictedPerformance, 15, pageW - 30);

      // Footer
      y += 8;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Generated by STAR Trainer AI · Powered by Gemini 2.5 Pro & Gemini 3 Flash Preview", pageW / 2, y, { align: "center" });

      doc.save(`HR_Interview_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "Report Downloaded", description: "Your detailed HR interview report has been saved." });
    } catch (e: unknown) {
      console.error("Report generation error:", e);
      toast({ title: "Error", description: (e as Error)?.message || "Failed to generate report.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className="gradient-primary text-primary-foreground font-display font-semibold px-6 py-5 text-base hover:opacity-90 transition-opacity"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Download PDF Report
        </>
      )}
    </Button>
  );
};
