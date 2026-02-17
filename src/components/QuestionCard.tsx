import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

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

  const handleTranscript = useCallback((transcript: string) => {
    setAnswer((prev) => (prev ? prev + " " + transcript : transcript));
  }, []);

  const { startListening, stopListening, isListening, interimTranscript, supported } =
    useSpeechRecognition({ onTranscript: handleTranscript });

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer("");
      if (isListening) stopListening();
    }
  };

  return (
    <div className="gradient-card rounded-xl border border-border p-5 shadow-card animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4">
        <span className="gradient-primary text-primary-foreground font-display font-bold text-xs px-3 py-1 rounded-full">
          Q{questionNumber}/{totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < questionNumber ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold text-foreground mb-1.5">
        {question}
      </h2>

      <p className="text-muted-foreground text-xs mb-4">
        Use the <span className="text-primary font-semibold">STAR method</span>: Situation → Task → Action → Result
      </p>

      <div className="relative">
        <Textarea
          value={answer + (interimTranscript ? (answer ? " " : "") + interimTranscript : "")}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type or use the mic to speak your answer..."
          className="min-h-[140px] bg-background/50 border-border focus:border-primary resize-none text-foreground placeholder:text-muted-foreground text-sm pr-12"
          disabled={isLoading}
        />
        {supported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className={`absolute top-2 right-2 h-8 w-8 p-0 rounded-full ${
              isListening ? "bg-destructive/20 text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {isListening && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Listening... speak your answer
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">
          {answer.length} characters
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isLoading}
          className="gradient-primary text-primary-foreground font-display font-semibold px-5 hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
