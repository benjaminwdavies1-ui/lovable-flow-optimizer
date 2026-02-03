import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's recordings and SOPs
    const [recordingsRes, sopsRes] = await Promise.all([
      supabase
        .from("recordings")
        .select("id, title, step_count, duration_seconds, status")
        .eq("user_id", user_id),
      supabase
        .from("sops")
        .select("id, title, description, status")
        .eq("user_id", user_id),
    ]);

    const recordings = recordingsRes.data || [];
    const sops = sopsRes.data || [];

    // Fetch all steps for the user's recordings
    let allSteps: any[] = [];
    if (recordings.length > 0) {
      const recordingIds = recordings.map((r) => r.id);
      const { data: steps } = await supabase
        .from("steps")
        .select("*")
        .in("recording_id", recordingIds);
      allSteps = steps || [];
    }

    // Fetch all SOP steps
    let allSopSteps: any[] = [];
    if (sops.length > 0) {
      const sopIds = sops.map((s) => s.id);
      const { data: sopSteps } = await supabase
        .from("sop_steps")
        .select("*")
        .in("sop_id", sopIds);
      allSopSteps = sopSteps || [];
    }

    // Build context for AI analysis
    const analysisContext = {
      totalRecordings: recordings.length,
      totalSops: sops.length,
      totalSteps: allSteps.length + allSopSteps.length,
      recordingTitles: recordings.map((r) => r.title),
      sopTitles: sops.map((s) => s.title),
      actionTypeCounts: allSteps.reduce((acc, s) => {
        acc[s.action_type] = (acc[s.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageStepsPerProcess:
        recordings.length > 0
          ? Math.round(
              recordings.reduce((acc, r) => acc + (r.step_count || 0), 0) /
                recordings.length
            )
          : 0,
      warningSteps: allSteps.filter((s) => s.has_warning).length + allSopSteps.filter((s) => s.has_warning).length,
      instructionSamples: allSteps
        .filter((s) => s.instruction_text)
        .slice(0, 10)
        .map((s) => s.instruction_text),
    };

    if (!lovableApiKey) {
      // Without AI, generate basic insights
      const insights = generateBasicInsights(analysisContext, user_id);
      
      for (const insight of insights.contexts) {
        await supabase.from("business_context").upsert(insight, {
          onConflict: "id",
        });
      }

      for (const rec of insights.recommendations) {
        await supabase.from("ai_recommendations").insert(rec);
      }

      return new Response(
        JSON.stringify({ success: true, insights_count: insights.contexts.length + insights.recommendations.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to generate deeper insights
    const prompt = `Analyze this business process data and provide insights:

${JSON.stringify(analysisContext, null, 2)}

Provide a JSON response with:
1. "patterns": Array of process patterns you identified (max 3)
2. "rules": Array of business rules you inferred (max 2)
3. "recommendations": Array of optimization suggestions (max 3)

Each pattern/rule should have: title, content, confidence (0-1)
Each recommendation should have: type (automation|consolidation|warning|efficiency), title, description

Only return valid JSON, no markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a business process analyst. Analyze data and provide actionable insights." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      // Fallback to basic insights
      const insights = generateBasicInsights(analysisContext, user_id);
      
      for (const insight of insights.contexts) {
        await supabase.from("business_context").upsert(insight, { onConflict: "id" });
      }
      for (const rec of insights.recommendations) {
        await supabase.from("ai_recommendations").insert(rec);
      }

      return new Response(
        JSON.stringify({ success: true, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsed = null;
    }

    if (parsed) {
      // Save patterns as business context
      if (parsed.patterns) {
        for (const pattern of parsed.patterns) {
          await supabase.from("business_context").insert({
            user_id,
            context_type: "process_pattern",
            title: pattern.title,
            content: pattern.content,
            confidence_score: pattern.confidence || 0.7,
            source_ids: recordings.slice(0, 3).map((r) => r.id),
          });
        }
      }

      // Save rules as business context
      if (parsed.rules) {
        for (const rule of parsed.rules) {
          await supabase.from("business_context").insert({
            user_id,
            context_type: "business_rule",
            title: rule.title,
            content: rule.content,
            confidence_score: rule.confidence || 0.6,
            source_ids: sops.slice(0, 3).map((s) => s.id),
          });
        }
      }

      // Save recommendations
      if (parsed.recommendations) {
        for (const rec of parsed.recommendations) {
          await supabase.from("ai_recommendations").insert({
            user_id,
            recommendation_type: rec.type || "efficiency",
            title: rec.title,
            description: rec.description,
            affected_processes: sops.slice(0, 2).map((s) => s.id),
            status: "pending",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, ai_generated: !!parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analyze business context error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateBasicInsights(context: any, userId: string) {
  const contexts: any[] = [];
  const recommendations: any[] = [];

  // Generate pattern based on action types
  if (context.actionTypeCounts && Object.keys(context.actionTypeCounts).length > 0) {
    const mostCommon = Object.entries(context.actionTypeCounts).sort(
      (a: any, b: any) => b[1] - a[1]
    )[0];

    contexts.push({
      user_id: userId,
      context_type: "process_pattern",
      title: `Primary Action: ${mostCommon[0]}`,
      content: `Your processes predominantly use "${mostCommon[0]}" actions (${mostCommon[1]} occurrences). This suggests a ${mostCommon[0] === "click" ? "UI-heavy" : "form-based"} workflow pattern.`,
      confidence_score: 0.8,
      source_ids: [],
    });
  }

  // Generate insight about process complexity
  if (context.averageStepsPerProcess > 0) {
    const complexity = context.averageStepsPerProcess > 15 ? "complex" : context.averageStepsPerProcess > 8 ? "moderate" : "simple";
    
    contexts.push({
      user_id: userId,
      context_type: "optimization_insight",
      title: `${complexity.charAt(0).toUpperCase() + complexity.slice(1)} Process Structure`,
      content: `Your average process has ${context.averageStepsPerProcess} steps, indicating ${complexity} workflows. ${complexity === "complex" ? "Consider breaking down larger processes into smaller, reusable components." : ""}`,
      confidence_score: 0.7,
      source_ids: [],
    });
  }

  // Generate recommendations
  if (context.warningSteps > 3) {
    recommendations.push({
      user_id: userId,
      recommendation_type: "warning",
      title: "Review Warning Steps",
      description: `You have ${context.warningSteps} steps flagged with warnings. Review these to ensure critical information is being captured and communicated.`,
      affected_processes: [],
      status: "pending",
    });
  }

  if (context.totalRecordings > 5 && context.totalSops < context.totalRecordings / 2) {
    recommendations.push({
      user_id: userId,
      recommendation_type: "efficiency",
      title: "Convert Recordings to SOPs",
      description: `You have ${context.totalRecordings} recordings but only ${context.totalSops} SOPs. Consider converting more recordings into documented procedures.`,
      affected_processes: [],
      status: "pending",
    });
  }

  return { contexts, recommendations };
}
