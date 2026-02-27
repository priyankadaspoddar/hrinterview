import { useEffect, useRef, useState, useCallback } from "react";

const SpeechRecognition =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface UseSpeechRecognitionOptions {
  onTranscript: (transcript: string) => void;
}

export const useSpeechRecognition = ({ onTranscript }: UseSpeechRecognitionOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const isListeningRef = useRef(false);
  const supported = !!SpeechRecognition;

  const initRecognition = useCallback(() => {
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        onTranscript(final);
        setInterimTranscript("");
      }
      if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // eslint-disable-next-line no-empty
        try { recognition.start(); } catch {}
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error !== "no-speech") {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    return recognition;
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    if (recognitionRef.current && !isListeningRef.current) {
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { startListening, stopListening, isListening, interimTranscript, supported };
};
