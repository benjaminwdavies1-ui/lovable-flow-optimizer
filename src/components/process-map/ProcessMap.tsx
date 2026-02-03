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
    data: {
      label: "Start",
      actionType: "start",
      hasWarning: false,
    } as ProcessNodeData,
  });

  // Step nodes
  sortedSteps.forEach((step, index) => {
    const nodeId = `step-${step.id}`;
    const label = step.title || step.instruction_text || step.description || `Step ${step.order_number}`;
    
    nodes.push({
      id: nodeId,
      type: "step",
      position: { x: startX, y: startY + (index + 1) * nodeSpacingY },
      data: {
        label: label.length > 40 ? label.substring(0, 40) + "..." : label,
        actionType: step.action_type || "custom",
        hasWarning: step.has_warning || false,
        stepNumber: step.order_number,
      } as ProcessNodeData,
    });

    // Edge from previous node
    const sourceId = index === 0 ? "start" : `step-${sortedSteps[index - 1].id}`;
    edges.push({
      id: `edge-${sourceId}-${nodeId}`,
      source: sourceId,
      target: nodeId,
      type: "smoothstep",
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: { strokeWidth: 2 },
    });
  });

  // End node
  const endY = startY + (sortedSteps.length + 1) * nodeSpacingY;
  nodes.push({
    id: "end",
    type: "end",
    position: { x: startX, y: endY },
    data: {
      label: "Complete",
      actionType: "end",
      hasWarning: false,
    } as ProcessNodeData,
  });

  // Edge to end
  if (sortedSteps.length > 0) {
    const lastStepId = `step-${sortedSteps[sortedSteps.length - 1].id}`;
    edges.push({
      id: `edge-${lastStepId}-end`,
      source: lastStepId,
      target: "end",
      type: "smoothstep",
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: { strokeWidth: 2 },
    });
  }

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
