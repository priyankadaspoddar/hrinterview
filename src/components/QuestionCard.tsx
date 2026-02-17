import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
  isLoading: boolean;
}

export const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  isLoading,
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer("");
    }
  };

  return (
    <div className="gradient-card rounded-xl border border-border p-6 md:p-8 shadow-card animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="gradient-primary text-primary-foreground font-display font-bold text-sm px-3 py-1 rounded-full">
          Q{questionNumber}/{totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i < questionNumber ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-2">
        {question}
      </h2>

      <p className="text-muted-foreground text-sm mb-6">
        Use the <span className="text-primary font-semibold">STAR method</span>: Situation → Task → Action → Result
      </p>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Describe the situation, the task you faced, the action you took, and the result you achieved..."
        className="min-h-[180px] bg-background/50 border-border focus:border-primary resize-none text-foreground placeholder:text-muted-foreground"
        disabled={isLoading}
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">
          {answer.length} characters
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isLoading}
          className="gradient-primary text-primary-foreground font-display font-semibold px-6 hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Answer
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
