import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Step {
  id: string;
  order_number: number;
  action_type: string;
  instruction_text?: string;
  title?: string;
  description?: string;
  has_warning?: boolean;
  url?: string;
}

interface ProcessMapNode {
  id: string;
  type: "step" | "decision" | "start" | "end";
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

    // Process each step
    sortedSteps.forEach((step, index) => {
      const nodeId = `step-${step.id}`;
      const label = step.title || step.instruction_text || step.description || `Step ${step.order_number}`;

      // Determine if this could be a decision point based on action type
      const isDecision = step.action_type === "decision" || 
        (step.instruction_text?.toLowerCase().includes("if ") && 
         step.instruction_text?.toLowerCase().includes("then"));

      nodes.push({
        id: nodeId,
        type: isDecision ? "decision" : "step",
        label: label.length > 50 ? label.substring(0, 50) + "..." : label,
        actionType: step.action_type || "custom",
        hasWarning: step.has_warning || false,
        position: { x: startX, y: startY + (index + 1) * nodeSpacingY },
        stepNumber: step.order_number,
      });

      // Edge from previous node
      const sourceId = index === 0 ? "start" : `step-${sortedSteps[index - 1].id}`;
      edges.push({
        id: `edge-${sourceId}-${nodeId}`,
        source: sourceId,
        target: nodeId,
      });
    });

    // End node
    if (sortedSteps.length > 0) {
      const endY = startY + (sortedSteps.length + 1) * nodeSpacingY;
      nodes.push({
        id: "end",
        type: "end",
        label: "Complete",
        actionType: "end",
        hasWarning: false,
        position: { x: startX, y: endY },
      });

      const lastStepId = `step-${sortedSteps[sortedSteps.length - 1].id}`;
      edges.push({
        id: `edge-${lastStepId}-end`,
        source: lastStepId,
        target: "end",
      });
    }

    // Calculate some metadata
    const metadata = {
      totalSteps: sortedSteps.length,
      warningSteps: sortedSteps.filter(s => s.has_warning).length,
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
