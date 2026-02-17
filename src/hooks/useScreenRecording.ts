import { useState, useRef, useCallback, useEffect } from "react";

export interface CapturedStep {
  id: string;
  orderNumber: number;
  screenshotDataUrl: string;
  title: string;
  description: string;
  timestamp: number;
}

type RecordingState = "idle" | "recording" | "stopped";

export function useScreenRecording() {
  const [state, setState] = useState<RecordingState>("idle");
  const [capturedSteps, setCapturedSteps] = useState<CapturedStep[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepCountRef = useRef(0);
  const startTimeRef = useRef(0);

  // Capture a frame from the video stream
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");

    stepCountRef.current += 1;
    const stepNum = stepCountRef.current;

    const step: CapturedStep = {
      id: `capture-${Date.now()}-${stepNum}`,
      orderNumber: stepNum,
      screenshotDataUrl: dataUrl,
      title: `Step ${stepNum}`,
      description: "Click captured during recording",
      timestamp: Date.now(),
    };

    setCapturedSteps((prev) => [...prev, step]);
  }, []);

  // Click handler during recording
  const handleClick = useCallback(() => {
    captureFrame();
  }, [captureFrame]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    document.removeEventListener("mousedown", handleClick);
    setState("stopped");
  }, [handleClick]);

  // Start recording — must be called from a user gesture handler
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
      });
      streamRef.current = stream;

      // Create hidden video element
      if (!videoRef.current) {
        const video = document.createElement("video");
        video.style.display = "none";
        document.body.appendChild(video);
        videoRef.current = video;
      }

      // Create hidden canvas
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      // Reset state
      stepCountRef.current = 0;
      setCapturedSteps([]);
      setElapsedTime(0);
      startTimeRef.current = Date.now();

      // Timer
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Listen for clicks to capture frames
      document.addEventListener("mousedown", handleClick);

      // Handle user stopping via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });

      setState("recording");
    } catch {
      // User cancelled the screen picker
      setState("idle");
    }
  }, [handleClick, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      document.removeEventListener("mousedown", handleClick);
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
    };
  }, [handleClick]);

  const resetRecording = useCallback(() => {
    setCapturedSteps([]);
    setElapsedTime(0);
    setState("idle");
  }, []);

  return {
    startRecording,
    stopRecording,
    resetRecording,
    isRecording: state === "recording",
    isStopped: state === "stopped",
    capturedSteps,
    elapsedTime,
    stepCount: capturedSteps.length,
  };
}
