import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BranchStep {
  id: string;
  order_number: number;
  description: string;
}

interface Step {
  id: string;
  order_number: number;
  action_type: string;
  instruction_text?: string;
  title?: string;
  description?: string;
  has_warning?: boolean;
  url?: string;
  is_decision?: boolean;
  decision_mode?: string;
  yes_branch_steps?: BranchStep[];
  no_branch_steps?: BranchStep[];
}

interface ProcessMapNode {
  id: string;
  type: "step" | "decision" | "start" | "end" | "merge";
  label: string;
  actionType: string;
  hasWarning: boolean;
  position: { x: number; y: number };
  stepNumber?: number;
}

interface ProcessMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: { stroke?: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { steps } = await req.json() as { steps: Step[] };

    if (!steps || !Array.isArray(steps)) {
      return new Response(
        JSON.stringify({ error: "Invalid steps data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sortedSteps = [...steps].sort((a, b) => a.order_number - b.order_number);
    const nodeSpacingY = 120;
    const startX = 250;
    const startY = 50;

    const nodes: ProcessMapNode[] = [];
    const edges: ProcessMapEdge[] = [];

    // Start node
    nodes.push({
      id: "start",
      type: "start",
      label: "Start",
      actionType: "start",
      hasWarning: false,
      position: { x: startX, y: startY },
    });

    let currentY = startY;

    sortedSteps.forEach((step, index) => {
      currentY += nodeSpacingY;
      const nodeId = `step-${step.id}`;
      const label = step.title || step.instruction_text || step.description || `Step ${step.order_number}`;
      const truncLabel = label.length > 50 ? label.substring(0, 50) + "..." : label;

      const prevId = index === 0 ? "start" : (() => {
        const prev = sortedSteps[index - 1];
        if (prev.is_decision && prev.decision_mode === "split") return `merge-${prev.id}`;
        return `step-${prev.id}`;
      })();

      const isSplitDecision = step.is_decision && step.decision_mode === "split";

      if (isSplitDecision) {
        // Decision node
        nodes.push({
          id: nodeId,
          type: "decision",
          label: truncLabel,
          actionType: "decision",
          hasWarning: step.has_warning || false,
          position: { x: startX, y: currentY },
          stepNumber: step.order_number,
        });

        edges.push({ id: `edge-${prevId}-${nodeId}`, source: prevId, target: nodeId });

        const yesSteps = step.yes_branch_steps || [];
        const noSteps = step.no_branch_steps || [];
        const maxBranchLen = Math.max(yesSteps.length, noSteps.length, 1);

        // YES branch
        let lastYesId = nodeId;
        yesSteps.forEach((bs, bi) => {
          const bsId = `yes-${step.id}-${bs.id}`;
          nodes.push({
            id: bsId,
            type: "step",
            label: bs.description || `YES-${bs.order_number}`,
            actionType: "custom",
            hasWarning: false,
            position: { x: startX - 220, y: currentY + (bi + 1) * nodeSpacingY },
          });
          edges.push({
            id: `edge-${lastYesId}-${bsId}`,
            source: lastYesId,
            target: bsId,
            label: bi === 0 ? "Yes" : undefined,
            style: { stroke: "#10b981" },
          });
          lastYesId = bsId;
        });

        // NO branch
        let lastNoId = nodeId;
        noSteps.forEach((bs, bi) => {
          const bsId = `no-${step.id}-${bs.id}`;
          nodes.push({
            id: bsId,
            type: "step",
            label: bs.description || `NO-${bs.order_number}`,
            actionType: "custom",
            hasWarning: false,
            position: { x: startX + 220, y: currentY + (bi + 1) * nodeSpacingY },
          });
          edges.push({
            id: `edge-${lastNoId}-${bsId}`,
            source: lastNoId,
            target: bsId,
            label: bi === 0 ? "No" : undefined,
            style: { stroke: "#ef4444" },
          });
          lastNoId = bsId;
        });

        // Merge node
        currentY += maxBranchLen * nodeSpacingY + nodeSpacingY;
        const mergeId = `merge-${step.id}`;
        nodes.push({
          id: mergeId,
          type: "merge",
          label: "Merge",
          actionType: "merge",
          hasWarning: false,
          position: { x: startX, y: currentY },
        });

        if (yesSteps.length > 0) {
          edges.push({ id: `edge-${lastYesId}-${mergeId}`, source: lastYesId, target: mergeId });
        } else {
          edges.push({ id: `edge-yes-empty-${mergeId}`, source: nodeId, target: mergeId, label: "Yes", style: { stroke: "#10b981" } });
        }
        if (noSteps.length > 0) {
          edges.push({ id: `edge-${lastNoId}-${mergeId}`, source: lastNoId, target: mergeId });
        } else {
          edges.push({ id: `edge-no-empty-${mergeId}`, source: nodeId, target: mergeId, label: "No", style: { stroke: "#ef4444" } });
        }
      } else {
        // Regular step
        const isDecision = step.action_type === "decision" ||
          (step.instruction_text?.toLowerCase().includes("if ") &&
           step.instruction_text?.toLowerCase().includes("then"));

        nodes.push({
          id: nodeId,
          type: isDecision ? "decision" : "step",
          label: truncLabel,
          actionType: step.action_type || "custom",
          hasWarning: step.has_warning || false,
          position: { x: startX, y: currentY },
          stepNumber: step.order_number,
        });

        edges.push({ id: `edge-${prevId}-${nodeId}`, source: prevId, target: nodeId });
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
      label: "Complete",
      actionType: "end",
      hasWarning: false,
      position: { x: startX, y: currentY },
    });

    edges.push({ id: `edge-${lastNodeId}-end`, source: lastNodeId, target: "end" });

    const metadata = {
      totalSteps: sortedSteps.length,
      warningSteps: sortedSteps.filter(s => s.has_warning).length,
      decisionPoints: sortedSteps.filter(s => s.is_decision).length,
      actionTypes: sortedSteps.reduce((acc, s) => {
        acc[s.action_type] = (acc[s.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      uniqueUrls: [...new Set(sortedSteps.filter(s => s.url).map(s => s.url))].length,
    };

    return new Response(
      JSON.stringify({ nodes, edges, metadata }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate process map error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
