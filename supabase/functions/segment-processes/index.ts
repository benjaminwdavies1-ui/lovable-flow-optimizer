import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, date } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch unclustered activity events for the target date
    const { data: events, error: eventsError } = await supabase
      .from("activity_events")
      .select("*")
      .eq("user_id", user_id)
      .eq("session_date", targetDate)
      .is("cluster_id", null)
      .order("timestamp", { ascending: true });

    if (eventsError) {
      console.error("Fetch events error:", eventsError);
      throw new Error("Failed to fetch activity events");
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unclustered events found", clusters_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a summary of the events for AI analysis
    const eventSummary = events.map((e: any, i: number) => ({
      index: i,
      time: new Date(e.timestamp).toLocaleTimeString(),
      action: e.action_type,
      url: e.url,
      element: e.element_info?.text || e.element_info?.tagName || "unknown",
    }));

    if (!lovableApiKey) {
      // Fallback: simple time-gap-based segmentation
      const clusters = segmentByTimeGaps(events, user_id);
      for (const cluster of clusters) {
        const { data: inserted } = await supabase
          .from("process_clusters")
          .insert(cluster)
          .select("id")
          .single();

        if (inserted) {
          const clusterEventIds = events
            .filter((e: any) =>
              new Date(e.timestamp) >= new Date(cluster.start_time!) &&
              new Date(e.timestamp) <= new Date(cluster.end_time!)
            )
            .map((e: any) => e.id);

          if (clusterEventIds.length > 0) {
            await supabase
              .from("activity_events")
              .update({ cluster_id: inserted.id })
              .in("id", clusterEventIds);
          }
        }
      }

      return new Response(
        JSON.stringify({ message: "Segmented using time gaps", clusters_created: clusters.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to segment events into process clusters
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a business process analyst. Given a sequence of browser interactions captured throughout a work day, identify distinct business processes. Group related actions together based on:
1. Time proximity (actions close in time likely belong to the same process)
2. URL/domain patterns (actions on the same site often form a process)
3. Logical flow (login → navigate → fill form → submit = one process)

Name each process clearly and provide a brief description.`,
          },
          {
            role: "user",
            content: `Segment these ${events.length} browser interactions into distinct business processes:\n\n${JSON.stringify(eventSummary, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "segment_processes",
              description: "Group browser interactions into distinct business processes",
              parameters: {
                type: "object",
                properties: {
                  processes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short name for this process" },
                        description: { type: "string", description: "Brief description of what this process does" },
                        start_index: { type: "number", description: "Index of first event in this process" },
                        end_index: { type: "number", description: "Index of last event in this process" },
                        confidence: { type: "number", description: "Confidence score 0-1" },
                      },
                      required: ["title", "description", "start_index", "end_index", "confidence"],
                    },
                  },
                },
                required: ["processes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "segment_processes" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    let processes: any[] = [];

    if (toolCalls?.length > 0) {
      const args = JSON.parse(toolCalls[0].function.arguments);
      processes = args.processes || [];
    }

    // Create clusters and assign events
    let clustersCreated = 0;
    for (const process of processes) {
      const startIdx = Math.max(0, process.start_index);
      const endIdx = Math.min(events.length - 1, process.end_index);
      const clusterEvents = events.slice(startIdx, endIdx + 1);

      if (clusterEvents.length === 0) continue;

      const { data: inserted } = await supabase
        .from("process_clusters")
        .insert({
          user_id,
          title: process.title,
          description: process.description,
          start_time: clusterEvents[0].timestamp,
          end_time: clusterEvents[clusterEvents.length - 1].timestamp,
          event_count: clusterEvents.length,
          confidence_score: process.confidence || 0.7,
          status: "detected",
        })
        .select("id")
        .single();

      if (inserted) {
        const eventIds = clusterEvents.map((e: any) => e.id);
        await supabase
          .from("activity_events")
          .update({ cluster_id: inserted.id })
          .in("id", eventIds);

        clustersCreated++;
      }
    }

    return new Response(
      JSON.stringify({ message: `AI segmented into ${clustersCreated} processes`, clusters_created: clustersCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Segment processes error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple time-gap-based segmentation fallback
function segmentByTimeGaps(events: any[], userId: string) {
  const GAP_MS = 5 * 60 * 1000; // 5 minutes
  const clusters: any[] = [];
  let currentGroup: any[] = [];

  for (let i = 0; i < events.length; i++) {
    if (currentGroup.length === 0) {
      currentGroup.push(events[i]);
      continue;
    }

    const prevTime = new Date(currentGroup[currentGroup.length - 1].timestamp).getTime();
    const currTime = new Date(events[i].timestamp).getTime();

    if (currTime - prevTime > GAP_MS) {
      // End current group, start new one
      clusters.push({
        user_id: userId,
        title: `Activity Block ${clusters.length + 1}`,
        description: `${currentGroup.length} actions from ${new Date(currentGroup[0].timestamp).toLocaleTimeString()} to ${new Date(currentGroup[currentGroup.length - 1].timestamp).toLocaleTimeString()}`,
        start_time: currentGroup[0].timestamp,
        end_time: currentGroup[currentGroup.length - 1].timestamp,
        event_count: currentGroup.length,
        confidence_score: 0.5,
        status: "detected",
      });
      currentGroup = [events[i]];
    } else {
      currentGroup.push(events[i]);
    }
  }

  // Final group
  if (currentGroup.length > 0) {
    clusters.push({
      user_id: userId,
      title: `Activity Block ${clusters.length + 1}`,
      description: `${currentGroup.length} actions from ${new Date(currentGroup[0].timestamp).toLocaleTimeString()} to ${new Date(currentGroup[currentGroup.length - 1].timestamp).toLocaleTimeString()}`,
      start_time: currentGroup[0].timestamp,
      end_time: currentGroup[currentGroup.length - 1].timestamp,
      event_count: currentGroup.length,
      confidence_score: 0.5,
      status: "detected",
    });
  }

  return clusters;
}
