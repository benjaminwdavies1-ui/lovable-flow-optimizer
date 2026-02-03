import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { BusinessContextCard, type BusinessContext } from "@/components/insights/BusinessContextCard";
import { ProcessMap, type Step } from "@/components/process-map/ProcessMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, FileText, Video, TrendingUp, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Insights() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch business context
  const { data: businessContext, isLoading: isLoadingContext } = useQuery({
    queryKey: ["business-context", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_context")
        .select("*")
        .eq("user_id", user?.id)
        .order("confidence_score", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as BusinessContext[];
    },
    enabled: !!user?.id,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["insights-stats", user?.id],
    queryFn: async () => {
      const [recordingsRes, sopsRes, stepsRes] = await Promise.all([
        supabase
          .from("recordings")
          .select("id, step_count, duration_seconds")
          .eq("user_id", user?.id),
        supabase.from("sops").select("id, status").eq("user_id", user?.id),
        supabase
          .from("sop_steps")
          .select("id, has_warning, sop_id")
          .in(
            "sop_id",
            (
              await supabase.from("sops").select("id").eq("user_id", user?.id)
            ).data?.map((s) => s.id) || []
          ),
      ]);

      const recordings = recordingsRes.data || [];
      const sops = sopsRes.data || [];
      const sopSteps = stepsRes.data || [];

      const totalSteps = recordings.reduce(
        (acc, r) => acc + (r.step_count || 0),
        0
      );
      const avgSteps =
        recordings.length > 0 ? Math.round(totalSteps / recordings.length) : 0;
      const totalDuration = recordings.reduce(
        (acc, r) => acc + (r.duration_seconds || 0),
        0
      );
      const warningCount = sopSteps.filter((s) => s.has_warning).length;
      const publishedCount = sops.filter((s) => s.status === "published").length;

      return {
        totalRecordings: recordings.length,
        totalSops: sops.length,
        avgStepsPerProcess: avgSteps,
        totalDuration,
        warningCount,
        publishedCount,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch sample steps for process map
  const { data: sampleSteps, isLoading: isLoadingSteps } = useQuery({
    queryKey: ["sample-process-steps", user?.id],
    queryFn: async () => {
      // Get the most recent SOP with steps
      const { data: sops } = await supabase
        .from("sops")
        .select("id, title")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!sops?.length) return { steps: [], title: "No processes yet" };

      const { data: steps } = await supabase
        .from("sop_steps")
        .select("*")
        .eq("sop_id", sops[0].id)
        .order("order_number");

      return { 
        steps: (steps as Step[]) || [], 
        title: sops[0].title || "Latest Process" 
      };
    },
    enabled: !!user?.id,
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-business-context`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ user_id: user?.id }),
        }
      );

      if (!response.ok) throw new Error("Analysis failed");

      toast.success("Analysis complete! New insights are available.");
    } catch (error) {
      toast.error("Failed to analyze processes");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of your business processes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recordings</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalRecordings ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Captured workflows
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">SOPs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSops ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.publishedCount ?? 0} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Steps</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgStepsPerProcess ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Per process</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.warningCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Steps with warnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Process Map */}
          <ProcessMap
            steps={sampleSteps?.steps || []}
            title={sampleSteps?.title}
            isLoading={isLoadingSteps}
          />

          {/* Recommendations */}
          <InsightsPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {/* Business Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Business Knowledge
            </CardTitle>
            <CardDescription>
              Patterns and insights learned from your processes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContext ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : businessContext?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">
                  No business context yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Record some workflows and run analysis to build your knowledge
                  base.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {businessContext?.map((ctx) => (
                  <BusinessContextCard key={ctx.id} context={ctx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
