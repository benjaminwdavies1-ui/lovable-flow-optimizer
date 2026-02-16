import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  MousePointerClick,
  Navigation,
  FormInput,
  Type,
  AlertTriangle,
  Play,
  CheckCircle2,
  HelpCircle,
  Diamond,
  GitMerge,
} from "lucide-react";

export type ProcessNodeData = {
  label: string;
  actionType: string;
  hasWarning: boolean;
  stepNumber?: number;
};

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  click: MousePointerClick,
  navigation: Navigation,
  form_submit: FormInput,
  input: Type,
  custom: HelpCircle,
  start: Play,
  end: CheckCircle2,
  decision: Diamond,
  merge: GitMerge,
};

const actionColors: Record<string, string> = {
  click: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  navigation: "bg-purple-500/10 border-purple-500/30 text-purple-600",
  form_submit: "bg-green-500/10 border-green-500/30 text-green-600",
  input: "bg-orange-500/10 border-orange-500/30 text-orange-600",
  custom: "bg-muted border-border text-muted-foreground",
  start: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
  end: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
  decision: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
  merge: "bg-slate-500/10 border-slate-500/30 text-slate-600",
};

function ProcessNodeComponent({ data, type }: NodeProps) {
  const nodeData = data as ProcessNodeData;
  const Icon = actionIcons[nodeData.actionType] || HelpCircle;
  const colorClass = actionColors[nodeData.actionType] || actionColors.custom;
  const isStartOrEnd = type === "start" || type === "end";
  const isDecision = nodeData.actionType === "decision";

  return (
    <div
      className={cn(
        "relative px-4 py-3 border-2 shadow-sm transition-all min-w-[180px] max-w-[250px]",
        isDecision ? "rotate-0 rounded-lg" : "rounded-lg",
        colorClass,
        nodeData.hasWarning && "ring-2 ring-amber-400 ring-offset-2"
      )}
      style={isDecision ? { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", padding: "2rem 1.5rem", minWidth: "200px" } : undefined}
    >
      {!isStartOrEnd && type !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      )}

      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-md", isStartOrEnd ? "bg-current/10" : "bg-background")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {nodeData.stepNumber && (
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-60">
              Step {nodeData.stepNumber}
            </span>
          )}
          <p className="text-sm font-medium leading-tight truncate">{nodeData.label}</p>
        </div>
        {nodeData.hasWarning && (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        )}
      </div>

      {!isStartOrEnd && type !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      )}
    </div>
  );
}

export const ProcessNode = memo(ProcessNodeComponent);
