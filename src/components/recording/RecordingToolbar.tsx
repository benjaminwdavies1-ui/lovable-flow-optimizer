import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";

interface RecordingToolbarProps {
  elapsedTime: number;
  stepCount: number;
  onStop: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function RecordingToolbar({ elapsedTime, stepCount, onStop }: RecordingToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-background/95 border border-border shadow-lg px-6 py-3 backdrop-blur-sm">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
      </span>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {formatTime(elapsedTime)}
      </span>
      <span className="text-sm text-muted-foreground">
        {stepCount} {stepCount === 1 ? "step" : "steps"} captured
      </span>
      <Button size="sm" variant="destructive" onClick={onStop}>
        <Square className="mr-1 h-3 w-3" />
        Stop
      </Button>
    </div>
  );
}
