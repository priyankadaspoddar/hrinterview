import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LiveCameraHandle {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
}

export const LiveCamera = forwardRef<LiveCameraHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    videoRef,
    isActive,
  }));

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
    } catch {
      setError("Camera access denied");
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsActive(false);
  };

  const toggleCamera = () => {
    if (isActive) stopCamera();
    else startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="gradient-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="relative aspect-video bg-background/50">
        {isActive && !error ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-t-xl scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <VideoOff className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {error || "Camera off"}
              </p>
            </div>
          </div>
        )}
        {isActive && !error && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-display font-semibold text-foreground">LIVE</span>
          </div>
        )}
      </div>
      <div className="p-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Practice like a real interview</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCamera}
          className="text-muted-foreground hover:text-foreground h-7 px-2"
        >
          {isActive ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          <span className="ml-1 text-[10px]">{isActive ? "On" : "Off"}</span>
        </Button>
      </div>
    </div>
  );
});

LiveCamera.displayName = "LiveCamera";
