import { useEffect, useRef, useState } from "react";
import { Eye, Activity, Hand, Smile, Mic } from "lucide-react";

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail?: string;
}

const MetricItem = ({ icon, label, value, detail }: MetricItemProps) => {
  const getColor = (v: number) => {
    if (v >= 70) return "bg-success";
    if (v >= 40) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-display font-medium text-foreground">{label}</span>
        </div>
        <span className="text-xs font-display font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
    </div>
  );
};

interface RealTimeMetricsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isListening: boolean;
}

export const RealTimeMetrics = ({ videoRef, isActive, isListening }: RealTimeMetricsProps) => {
  const [metrics, setMetrics] = useState({
    eyeContact: 0,
    posture: 0,
    bodyLanguage: 0,
    expression: 0,
    voiceClarity: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const faceLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number>();

  // Try MediaPipe face detection for eye contact
  useEffect(() => {
    let cancelled = false;

    const loadMediaPipe = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });
        if (!cancelled) faceLandmarkerRef.current = faceLandmarker;
      } catch (e) {
        console.warn("MediaPipe load failed, using simulation", e);
      }
    };

    loadMediaPipe();
    return () => { cancelled = true; };
  }, []);

  // Run face detection loop
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
          // Estimate eye contact from face orientation (yaw/pitch)
          const yaw = Math.abs(Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI));
          const pitch = Math.abs(Math.asin(-matrix[9]) * (180 / Math.PI));
          const eyeScore = Math.max(0, Math.min(100, 100 - (yaw * 3 + pitch * 3)));

          setMetrics(prev => ({
            ...prev,
            eyeContact: Math.round(eyeScore),
            // Face detected = good posture proxy
            posture: Math.round(Math.max(0, Math.min(100, 85 - yaw * 2))),
            expression: Math.round(Math.max(0, Math.min(100, 75 + Math.random() * 15 - pitch))),
          }));
        } else {
          setMetrics(prev => ({
            ...prev,
            eyeContact: Math.max(0, prev.eyeContact - 5),
            posture: Math.max(0, prev.posture - 3),
          }));
        }
      } catch {}

      animFrameRef.current = requestAnimationFrame(detect);
    };

    // Slight delay to let video start
    const timeout = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(detect);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, videoRef]);

  // Simulate body language & voice clarity
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        bodyLanguage: isActive
          ? Math.round(Math.min(100, Math.max(0, prev.bodyLanguage + (Math.random() * 20 - 8))))
          : 0,
        voiceClarity: isListening
          ? Math.round(Math.min(100, Math.max(30, prev.voiceClarity + (Math.random() * 20 - 6))))
          : 0,
      }));
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, [isActive, isListening]);

  return (
    <div className="gradient-card rounded-xl border border-border p-4 shadow-card space-y-3">
      <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        Real-time Metrics
      </h3>

      <MetricItem
        icon={<Eye className="h-3.5 w-3.5 text-primary" />}
        label="Eye Contact"
        value={metrics.eyeContact}
        detail="MediaPipe"
      />
      <MetricItem
        icon={<Activity className="h-3.5 w-3.5 text-accent" />}
        label="Posture"
        value={metrics.posture}
      />
      <MetricItem
        icon={<Hand className="h-3.5 w-3.5 text-warning" />}
        label="Body Language"
        value={metrics.bodyLanguage}
      />
      <MetricItem
        icon={<Smile className="h-3.5 w-3.5 text-success" />}
        label="Expression"
        value={metrics.expression}
      />
      <MetricItem
        icon={<Mic className="h-3.5 w-3.5 text-destructive" />}
        label="Voice Clarity"
        value={metrics.voiceClarity}
      />
    </div>
  );
};
