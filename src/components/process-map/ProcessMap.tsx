import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ProcessNode, type ProcessNodeData } from "./ProcessNode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Map } from "lucide-react";

export interface Step {
  id: string;
  order_number: number;
  action_type?: string;
  instruction_text?: string | null;
  title?: string | null;
  description?: string | null;
  has_warning?: boolean;
  is_decision?: boolean;
  decision_mode?: string;
  yes_branch_steps?: Array<{ id: string; order_number: number; description: string }>;
  no_branch_steps?: Array<{ id: string; order_number: number; description: string }>;
}

interface ProcessMapProps {
  steps: Step[];
  title?: string;
  isLoading?: boolean;
  className?: string;
}

const nodeTypes = {
  step: ProcessNode,
  start: ProcessNode,
  end: ProcessNode,
  decision: ProcessNode,
  merge: ProcessNode,
};

function generateNodesAndEdges(steps: Step[]): { nodes: Node[]; edges: Edge[] } {
  if (!steps.length) return { nodes: [], edges: [] };

  const sortedSteps = [...steps].sort((a, b) => a.order_number - b.order_number);
  const nodeSpacingY = 120;
  const startX = 250;
  const startY = 50;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Start node
  nodes.push({
    id: "start",
    type: "start",
    position: { x: startX, y: startY },
    data: { label: "Start", actionType: "start", hasWarning: false } as ProcessNodeData,
  });

  let currentY = startY;

  sortedSteps.forEach((step, index) => {
    currentY += nodeSpacingY;
    const nodeId = `step-${step.id}`;
    const label = step.title || step.instruction_text || step.description || `Step ${step.order_number}`;
    const truncLabel = label.length > 40 ? label.substring(0, 40) + "..." : label;
    const prevId = index === 0 ? "start" : (() => {
      const prev = sortedSteps[index - 1];
      if (prev.is_decision && prev.decision_mode === "split") return `merge-${prev.id}`;
      return `step-${prev.id}`;
    })();

    const isSplitDecision = step.is_decision && step.decision_mode === "split";

    if (isSplitDecision) {
      // Decision diamond node
      nodes.push({
        id: nodeId,
        type: "decision",
        position: { x: startX, y: currentY },
        data: { label: truncLabel, actionType: "decision", hasWarning: step.has_warning || false, stepNumber: step.order_number } as ProcessNodeData,
      });

      edges.push({
        id: `edge-${prevId}-${nodeId}`,
        source: prevId,
        target: nodeId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        style: { strokeWidth: 2 },
      });

      const yesSteps = step.yes_branch_steps || [];
      const noSteps = step.no_branch_steps || [];
      const maxBranchLen = Math.max(yesSteps.length, noSteps.length, 1);

      // YES branch (left)
      let lastYesId = nodeId;
      yesSteps.forEach((bs, bi) => {
        const bsId = `yes-${step.id}-${bs.id}`;
        nodes.push({
          id: bsId,
          type: "step",
          position: { x: startX - 220, y: currentY + (bi + 1) * nodeSpacingY },
          data: { label: bs.description || `YES-${bs.order_number}`, actionType: "custom", hasWarning: false, stepNumber: undefined } as ProcessNodeData,
        });
        edges.push({
          id: `edge-${lastYesId}-${bsId}`,
          source: lastYesId,
          target: bsId,
          type: "smoothstep",
          label: bi === 0 ? "Yes" : undefined,
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          style: { strokeWidth: 2, stroke: "#10b981" },
        });
        lastYesId = bsId;
      });

      // NO branch (right)
      let lastNoId = nodeId;
      noSteps.forEach((bs, bi) => {
        const bsId = `no-${step.id}-${bs.id}`;
        nodes.push({
          id: bsId,
          type: "step",
          position: { x: startX + 220, y: currentY + (bi + 1) * nodeSpacingY },
          data: { label: bs.description || `NO-${bs.order_number}`, actionType: "custom", hasWarning: false, stepNumber: undefined } as ProcessNodeData,
        });
        edges.push({
          id: `edge-${lastNoId}-${bsId}`,
          source: lastNoId,
          target: bsId,
          type: "smoothstep",
          label: bi === 0 ? "No" : undefined,
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          style: { strokeWidth: 2, stroke: "#ef4444" },
        });
        lastNoId = bsId;
      });

      // Merge node
      currentY += maxBranchLen * nodeSpacingY + nodeSpacingY;
      const mergeId = `merge-${step.id}`;
      nodes.push({
        id: mergeId,
        type: "merge",
        position: { x: startX, y: currentY },
        data: { label: "Merge", actionType: "merge", hasWarning: false } as ProcessNodeData,
      });

      // Connect last branch nodes to merge
      if (yesSteps.length > 0) {
        edges.push({
          id: `edge-${lastYesId}-${mergeId}`,
          source: lastYesId,
          target: mergeId,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          style: { strokeWidth: 2 },
        });
      } else {
        edges.push({
          id: `edge-yes-empty-${mergeId}`,
          source: nodeId,
          target: mergeId,
          type: "smoothstep",
          label: "Yes",
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          style: { strokeWidth: 2, stroke: "#10b981" },
        });
      }
      if (noSteps.length > 0) {
        edges.push({
          id: `edge-${lastNoId}-${mergeId}`,
          source: lastNoId,
          target: mergeId,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          style: { strokeWidth: 2 },
        });
      } else {
        edges.push({
          id: `edge-no-empty-${mergeId}`,
          source: nodeId,
          target: mergeId,
          type: "smoothstep",
          label: "No",
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          style: { strokeWidth: 2, stroke: "#ef4444" },
        });
      }
    } else {
      // Regular step node
      nodes.push({
        id: nodeId,
        type: "step",
        position: { x: startX, y: currentY },
        data: { label: truncLabel, actionType: step.action_type || "custom", hasWarning: step.has_warning || false, stepNumber: step.order_number } as ProcessNodeData,
      });

      edges.push({
        id: `edge-${prevId}-${nodeId}`,
        source: prevId,
        target: nodeId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        style: { strokeWidth: 2 },
      });
    }
  });

  // End node
  currentY += nodeSpacingY;
  const lastStep = sortedSteps[sortedSteps.length - 1];
  const lastNodeId = lastStep.is_decision && lastStep.decision_mode === "split"
    ? `merge-${lastStep.id}`
    : `step-${lastStep.id}`;

  nodes.push({
    id: "end",
    type: "end",
    position: { x: startX, y: currentY },
    data: { label: "Complete", actionType: "end", hasWarning: false } as ProcessNodeData,
  });

  edges.push({
    id: `edge-${lastNodeId}-end`,
    source: lastNodeId,
    target: "end",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
    style: { strokeWidth: 2 },
  });

  return { nodes, edges };
}

export function ProcessMap({ steps, title = "Process Map", isLoading, className }: ProcessMapProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateNodesAndEdges(steps),
    [steps]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!steps.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No steps to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] w-full rounded-b-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll
            zoomOnScroll
          >
            <Background gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as ProcessNodeData;
                if (data.hasWarning) return "#f59e0b";
                if (data.actionType === "start" || data.actionType === "end") return "#10b981";
                if (data.actionType === "click") return "#3b82f6";
                if (data.actionType === "navigation") return "#a855f7";
                if (data.actionType === "form_submit") return "#22c55e";
                return "#6b7280";
              }}
              maskColor="rgba(0,0,0,0.1)"
              className="!bg-background !border-border"
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
