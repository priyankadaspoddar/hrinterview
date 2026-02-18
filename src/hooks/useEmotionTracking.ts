import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmotionMetrics {
  // Fused scores (0-100)
  eyeContact: number;
  posture: number;
  bodyLanguage: number;
  expression: number;
  voiceClarity: number;
  confidence: number;
  engagement: number;
  stress: number;
  positivity: number;
  dominantEmotion: string;
}

interface MediaPipeMetrics {
  eyeContact: number;
  posture: number;
  expression: number;
}

interface GeminiMetrics {
  eyeContact: number;
  confidence: number;
  engagement: number;
  stress: number;
  positivity: number;
  professionalPresence: number;
  dominantEmotion: string;
}

const EMA_ALPHA = 0.3; // smoothing factor

function emaSmooth(prev: number, next: number): number {
  return Math.round(EMA_ALPHA * next + (1 - EMA_ALPHA) * prev);
}

// 70% local (MediaPipe) / 30% remote (Gemini vision) fusion
function fuse(local: number, remote: number): number {
  return Math.round(0.7 * local + 0.3 * remote);
}

export function useEmotionTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  isListening: boolean
) {
  const [metrics, setMetrics] = useState<EmotionMetrics>({
    eyeContact: 0, posture: 0, bodyLanguage: 0, expression: 0,
    voiceClarity: 0, confidence: 0, engagement: 0, stress: 0,
    positivity: 0, dominantEmotion: "neutral",
  });
  const [timeline, setTimeline] = useState<EmotionMetrics[]>([]);

  const faceLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number>();
  const localRef = useRef<MediaPipeMetrics>({ eyeContact: 0, posture: 0, expression: 0 });
  const geminiRef = useRef<GeminiMetrics>({
    eyeContact: 50, confidence: 50, engagement: 50,
    stress: 30, positivity: 50, professionalPresence: 50,
    dominantEmotion: "neutral",
  });
  const geminiIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const bodyLangRef = useRef(50);
  const voiceClarityRef = useRef(0);

  // Load MediaPipe
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const fs = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const fl = await FaceLandmarker.createFromOptions(fs, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });
        if (!cancelled) faceLandmarkerRef.current = fl;
      } catch (e) {
        console.warn("MediaPipe load failed", e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // MediaPipe detection loop
  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const detect = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !faceLandmarkerRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      try {
        const result = faceLandmarkerRef.current.detectForVideo(video, performance.now());
        if (result.facialTransformationMatrixes?.length > 0) {
          const matrix = result.facialTransformationMatrixes[0].data;
          const yaw = Math.abs(Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI));
          const pitch = Math.abs(Math.asin(-matrix[9]) * (180 / Math.PI));
          
          localRef.current = {
            eyeContact: Math.max(0, Math.min(100, 100 - (yaw * 3 + pitch * 3))),
            posture: Math.max(0, Math.min(100, 85 - yaw * 2)),
            expression: Math.max(0, Math.min(100, 75 + Math.random() * 15 - pitch)),
          };
        } else {
          localRef.current = {
            eyeContact: Math.max(0, localRef.current.eyeContact - 5),
            posture: Math.max(0, localRef.current.posture - 3),
            expression: Math.max(0, localRef.current.expression - 2),
          };
        }
      } catch {}
      animFrameRef.current = requestAnimationFrame(detect);
    };

    const timeout = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(detect);
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, videoRef]);

  // Capture frame as base64
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
  }, [videoRef]);

  // Gemini vision analysis every ~8 seconds
  useEffect(() => {
    if (!isActive) return;

    geminiIntervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (!frame) return;
      try {
        const { data, error } = await supabase.functions.invoke("hr-interview", {
          body: { action: "analyze_emotion", frameBase64: frame },
        });
        if (!error && data?.emotionData) {
          geminiRef.current = data.emotionData;
        }
      } catch (e) {
        console.warn("Gemini emotion analysis failed", e);
      }
    }, 8000);

    return () => clearInterval(geminiIntervalRef.current);
  }, [isActive, captureFrame]);

  // Simulate body language & voice + fuse all metrics with EMA
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate body language with slight random walk
      bodyLangRef.current = isActive
        ? Math.min(100, Math.max(0, bodyLangRef.current + (Math.random() * 20 - 8)))
        : 0;

      // Voice clarity based on listening state
      voiceClarityRef.current = isListening
        ? Math.min(100, Math.max(30, voiceClarityRef.current + (Math.random() * 20 - 6)))
        : Math.max(0, voiceClarityRef.current - 5);

      setMetrics(prev => {
        const local = localRef.current;
        const remote = geminiRef.current;

        // 70/30 fusion for eye contact, EMA smoothing for all
        const fusedEye = fuse(local.eyeContact, remote.eyeContact);
        const fusedExpression = fuse(local.expression, remote.positivity);
        const fusedPosture = fuse(local.posture, remote.professionalPresence);

        const next: EmotionMetrics = {
          eyeContact: emaSmooth(prev.eyeContact, fusedEye),
          posture: emaSmooth(prev.posture, fusedPosture),
          bodyLanguage: emaSmooth(prev.bodyLanguage, bodyLangRef.current),
          expression: emaSmooth(prev.expression, fusedExpression),
          voiceClarity: emaSmooth(prev.voiceClarity, voiceClarityRef.current),
          confidence: emaSmooth(prev.confidence, remote.confidence),
          engagement: emaSmooth(prev.engagement, remote.engagement),
          stress: emaSmooth(prev.stress, remote.stress),
          positivity: emaSmooth(prev.positivity, remote.positivity),
          dominantEmotion: remote.dominantEmotion || "neutral",
        };
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive, isListening]);

  // Record timeline snapshots every 10s
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeline(prev => [...prev, { ...metrics }]);
    }, 10000);
    return () => clearInterval(interval);
  }, [isActive, metrics]);

  const resetTimeline = useCallback(() => setTimeline([]), []);

  return { metrics, timeline, resetTimeline };
}
