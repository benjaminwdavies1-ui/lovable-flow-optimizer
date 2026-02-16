import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BranchStep {
  id: string;
  order_number: number;
  description: string;
}

interface DecisionBranchEditorProps {
  yesBranchSteps: BranchStep[];
  noBranchSteps: BranchStep[];
  onYesBranchChange: (steps: BranchStep[]) => void;
  onNoBranchChange: (steps: BranchStep[]) => void;
}

function BranchColumn({
  label,
  icon: Icon,
  accentClass,
  borderClass,
  steps,
  onChange,
  prefix,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  borderClass: string;
  steps: BranchStep[];
  onChange: (steps: BranchStep[]) => void;
  prefix: string;
}) {
  const addStep = useCallback(() => {
    const newStep: BranchStep = {
      id: `${prefix}-${Date.now()}`,
      order_number: steps.length + 1,
      description: "",
    };
    onChange([...steps, newStep]);
  }, [steps, onChange, prefix]);

  const updateDescription = useCallback(
    (id: string, description: string) => {
      onChange(steps.map((s) => (s.id === id ? { ...s, description } : s)));
    },
    [steps, onChange]
  );

  const removeStep = useCallback(
    (id: string) => {
      const filtered = steps.filter((s) => s.id !== id);
      onChange(filtered.map((s, i) => ({ ...s, order_number: i + 1 })));
    },
    [steps, onChange]
  );

  const moveStep = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = steps.findIndex((s) => s.id === id);
      if ((direction === "up" && idx === 0) || (direction === "down" && idx === steps.length - 1)) return;
      const newSteps = [...steps];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
      onChange(newSteps.map((s, i) => ({ ...s, order_number: i + 1 })));
    },
    [steps, onChange]
  );

  return (
    <div className={cn("flex-1 rounded-lg border-2 p-3", borderClass)}>
      <div className={cn("flex items-center gap-2 mb-3 font-medium text-sm", accentClass)}>
        <Icon className="h-4 w-4" />
        {label} Path
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-start gap-2">
            <span className={cn("mt-2 text-xs font-mono font-medium shrink-0 w-8", accentClass)}>
              {prefix}-{step.order_number}
            </span>
            <Textarea
              value={step.description}
              onChange={(e) => updateDescription(step.id, e.target.value)}
              placeholder="Describe this substep..."
              className="min-h-[40px] resize-none text-sm flex-1"
            />
            <div className="flex flex-col gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveStep(step.id, "up")}
                disabled={idx === 0}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveStep(step.id, "down")}
                disabled={idx === steps.length - 1}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeStep(step.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addStep} className="w-full mt-2">
        <Plus className="mr-1 h-3 w-3" />
        Add Step
      </Button>
    </div>
  );
}

export function DecisionBranchEditor({
  yesBranchSteps,
  noBranchSteps,
  onYesBranchChange,
  onNoBranchChange,
}: DecisionBranchEditorProps) {
  return (
    <div className="flex gap-3 mt-3">
      <BranchColumn
        label="YES"
        icon={Check}
        accentClass="text-emerald-600"
        borderClass="border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20"
        steps={yesBranchSteps}
        onChange={onYesBranchChange}
        prefix="YES"
      />
      <BranchColumn
        label="NO"
        icon={X}
        accentClass="text-red-600"
        borderClass="border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20"
        steps={noBranchSteps}
        onChange={onNoBranchChange}
        prefix="NO"
      />
    </div>
  );
}
