import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getBusinessContext(supabase: any, userId: string) {
  try {
    // Fetch user's business context
    const { data: context } = await supabase
      .from("business_context")
      .select("title, content, context_type")
      .eq("user_id", userId)
      .order("confidence_score", { ascending: false })
      .limit(5);

    // Fetch user's SOPs summary
    const { data: sops } = await supabase
      .from("sops")
      .select("title, description, status")
      .eq("user_id", userId)
      .limit(10);

    // Fetch user's recordings summary
    const { data: recordings } = await supabase
      .from("recordings")
      .select("title, step_count, status")
      .eq("user_id", userId)
      .limit(10);

    // Fetch pending recommendations
    const { data: recommendations } = await supabase
      .from("ai_recommendations")
      .select("title, description, recommendation_type")
      .eq("user_id", userId)
      .eq("status", "pending")
      .limit(3);

    let contextBlock = "";

    if (sops?.length || recordings?.length) {
      contextBlock += "\n\n## User's Business Context\n";
      
      if (recordings?.length) {
        contextBlock += "\n**Recorded Processes:**\n";
        recordings.forEach((r: any) => {
          contextBlock += `- ${r.title} (${r.step_count || 0} steps, ${r.status})\n`;
        });
      }

      if (sops?.length) {
        contextBlock += "\n**SOPs:**\n";
        sops.forEach((s: any) => {
          contextBlock += `- ${s.title}${s.description ? `: ${s.description.substring(0, 50)}...` : ""} (${s.status})\n`;
        });
      }
    }

    if (context?.length) {
      contextBlock += "\n**Key Business Insights:**\n";
      context.forEach((c: any) => {
        contextBlock += `- [${c.context_type}] ${c.title}: ${c.content.substring(0, 100)}...\n`;
      });
    }

    if (recommendations?.length) {
      contextBlock += "\n**Active Recommendations:**\n";
      recommendations.forEach((r: any) => {
        contextBlock += `- [${r.recommendation_type}] ${r.title}\n`;
      });
    }

    return contextBlock;
  } catch (error) {
    console.error("Error fetching business context:", error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user_id } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch business context if user_id is provided
    let businessContext = "";
    if (user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      businessContext = await getBusinessContext(supabase, user_id);
    }

    const systemPrompt = `You are Opstrace Assistant, an AI helper for an operations intelligence platform. Your role is to help users with:

1. **Creating SOPs (Standard Operating Procedures)**: Guide users on how to document workflows, best practices for step organization, and tips for clear instructions.

2. **Recording Workflows**: Explain how to capture their processes, what makes a good recording, and how to edit and refine captured steps.

3. **Operations Best Practices**: Provide advice on process optimization, identifying automation opportunities, and improving operational efficiency.

4. **Using the Platform**: Help users navigate Opstrace features like the SOP editor, recording tools, and export options.

5. **Business Analysis**: When users ask about their processes, use the context below to provide specific, relevant answers about their actual workflows and SOPs.
${businessContext}

Keep responses concise, actionable, and professional. Use bullet points and numbered lists when explaining multi-step processes. When users ask "how do I do this?", provide specific, practical guidance.

When users ask about their processes (e.g., "What SOPs do I have?", "How do we handle X?"), refer to the business context above to give personalized answers.

If asked about features not yet implemented (like automation suggestions or insights), explain they're coming soon and offer alternative approaches.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});