import { Button } from "@/components/ui/button";
import { 
  MousePointer, 
  Keyboard, 
  ArrowRight, 
  GripVertical, 
  FileText,
  Camera,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionType = "click" | "type" | "navigate" | "scroll" | "custom";

export const actionTypeConfig = {
  click: { label: "Click", icon: MousePointer, color: "bg-blue-500" },
  type: { label: "Type", icon: Keyboard, color: "bg-green-500" },
  navigate: { label: "Navigate", icon: ArrowRight, color: "bg-purple-500" },
  scroll: { label: "Scroll", icon: GripVertical, color: "bg-orange-500" },
  custom: { label: "Custom", icon: FileText, color: "bg-gray-500" },
};

interface StepTypeButtonsProps {
  onAddStep: (type: ActionType) => void;
  isCapturing?: boolean;
}

export function StepTypeButtons({ onAddStep, isCapturing }: StepTypeButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(actionTypeConfig).map(([type, config]) => {
        const Icon = config.icon;
        return (
          <Button
            key={type}
            variant="outline"
            onClick={() => onAddStep(type as ActionType)}
            disabled={isCapturing}
            className="gap-2"
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className={cn("h-2 w-2 rounded-full", config.color)} />
                <Icon className="h-4 w-4" />
              </>
            )}
            {config.label}
            <Camera className="h-3 w-3 ml-1 text-muted-foreground" />
          </Button>
        );
      })}
    </div>
  );
}
