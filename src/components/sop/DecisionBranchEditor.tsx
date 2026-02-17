import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export interface BranchStep {
  id: string;
  title: string;
  description: string;
}

interface DecisionBranchEditorProps {
  yesBranchSteps: BranchStep[];
  noBranchSteps: BranchStep[];
  onYesBranchChange: (steps: BranchStep[]) => void;
  onNoBranchChange: (steps: BranchStep[]) => void;
}

function BranchList({
  label,
  color,
  steps,
  onChange,
}: {
  label: string;
  color: string;
  steps: BranchStep[];
  onChange: (steps: BranchStep[]) => void;
}) {
  const addStep = () => {
    onChange([
      ...steps,
      { id: crypto.randomUUID(), title: "", description: "" },
    ]);
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, field: "title" | "description", value: string) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start gap-2 pl-4">
          <span className="mt-2 text-xs text-muted-foreground">{i + 1}.</span>
          <div className="flex-1 space-y-1">
            <Input
              placeholder="Step title"
              value={step.title}
              onChange={(e) => updateStep(step.id, "title", e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Description (optional)"
              value={step.description}
              onChange={(e) => updateStep(step.id, "description", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => removeStep(step.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="ml-4 h-7 text-xs"
        onClick={addStep}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add step
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
    <div className="mt-3 space-y-4 rounded-lg border border-dashed p-3">
      <BranchList
        label="Yes Branch"
        color="bg-green-500"
        steps={yesBranchSteps}
        onChange={onYesBranchChange}
      />
      <BranchList
        label="No Branch"
        color="bg-red-500"
        steps={noBranchSteps}
        onChange={onNoBranchChange}
      />
    </div>
  );
}
