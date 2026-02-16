import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecordingStepData {
  id: string;
  orderNumber: number;
  actionType: "click" | "type" | "navigate" | "scroll" | "custom" | "decision";
  instructionText: string;
  url?: string;
  screenshotUrl?: string;
  hasWarning: boolean;
  warningText?: string;
  isRedacted: boolean;
  isDecision?: boolean;
  decisionMode?: "simple" | "split";
  yesBranchSteps?: Array<{ id: string; order_number: number; description: string }>;
  noBranchSteps?: Array<{ id: string; order_number: number; description: string }>;
}

interface ActionTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface RecordingStepProps {
  step: RecordingStepData;
  actionConfig: ActionTypeConfig;
  onUpdate: (id: string, updates: Partial<RecordingStepData>) => void;
  onRemove: (id: string) => void;
  onToggleWarning: (id: string) => void;
}

function RecordingStepComponent({
  step,
  actionConfig,
  onUpdate,
  onRemove,
  onToggleWarning,
}: RecordingStepProps) {
  const Icon = actionConfig.icon;

  const removeScreenshot = () => {
    onUpdate(step.id, { screenshotUrl: undefined });
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        step.hasWarning && "border-warning bg-warning/5"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
          {step.orderNumber}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <div className={cn("h-2 w-2 rounded-full", actionConfig.color)} />
              {actionConfig.label}
            </Badge>
            {step.hasWarning && (
              <Badge variant="outline" className="text-warning border-warning">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Warning
              </Badge>
            )}
            {step.screenshotUrl && (
              <Badge variant="outline" className="text-primary border-primary">
                <Image className="mr-1 h-3 w-3" />
                Screenshot
              </Badge>
            )}
          </div>

          <Textarea
            value={step.instructionText}
            onChange={(e) => onUpdate(step.id, { instructionText: e.target.value })}
            placeholder="Describe what to do in this step..."
            className="min-h-[60px] resize-none"
          />

          {step.actionType === "navigate" && (
            <Input
              value={step.url || ""}
              onChange={(e) => onUpdate(step.id, { url: e.target.value })}
              placeholder="https://example.com/page"
              className="mt-2"
            />
          )}

          {step.hasWarning && (
            <Textarea
              value={step.warningText || ""}
              onChange={(e) => onUpdate(step.id, { warningText: e.target.value })}
              placeholder="Enter warning message..."
              className="mt-2 min-h-[40px] resize-none border-warning"
            />
          )}

          {/* Screenshot Preview */}
          {step.screenshotUrl && (
            <div className="relative mt-3 group">
              <img
                src={step.screenshotUrl}
                alt={`Step ${step.orderNumber} screenshot`}
                className="rounded-lg border max-h-48 w-auto object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={removeScreenshot}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleWarning(step.id)}
            className={cn(step.hasWarning && "text-warning")}
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(step.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const RecordingStep = memo(RecordingStepComponent);
