import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { ProcessMap, type Step } from "@/components/process-map/ProcessMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Brain, FileText, TrendingUp, Loader2, Activity, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ProcessCluster {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  event_count: number;
  confidence_score: number;
  status: string;
  created_at: string;
}

export default function InsightsOverview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["insights-stats", user?.id],
    queryFn: async () => {
      const [sopsRes, stepsRes, eventsRes] = await Promise.all([
        supabase.from("sops").select("id, status").eq("user_id", user?.id),
        supabase.from("sop_steps").select("id, has_warning, sop_id").in(
          "sop_id",
          (await supabase.from("sops").select("id").eq("user_id", user?.id)).data?.map((s) => s.id) || []
        ),
        supabase.from("activity_events").select("id", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("session_date", new Date().toISOString().split("T")[0]),
      ]);

      const sops = sopsRes.data || [];
      const sopSteps = stepsRes.data || [];
      const avgSteps = sops.length > 0 ? Math.round(sopSteps.length / sops.length) : 0;
      const warningCount = sopSteps.filter((s) => s.has_warning).length;
      const publishedCount = sops.filter((s) => s.status === "published").length;

      return {
        totalSops: sops.length,
        avgStepsPerProcess: avgSteps,
        warningCount,
        publishedCount,
        todayEvents: eventsRes.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: sampleSteps, isLoading: isLoadingSteps } = useQuery({
    queryKey: ["sample-process-steps", user?.id],
    queryFn: async () => {
      const { data: sops } = await supabase
        .from("sops").select("id, title").eq("user_id", user?.id)
        .order("created_at", { ascending: false }).limit(1);
      if (!sops?.length) return { steps: [], title: "No processes yet" };
      const { data: steps } = await supabase
        .from("sop_steps").select("*").eq("sop_id", sops[0].id).order("order_number");
      return { steps: (steps as unknown as Step[]) || [], title: sops[0].title || "Latest Process" };
    },
    enabled: !!user?.id,
  });

  const { data: clusters, isLoading: isLoadingClusters } = useQuery({
    queryKey: ["process-clusters", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("process_clusters").select("*").eq("user_id", user?.id)
        .gte("created_at", today).order("start_time", { ascending: true });
      if (error) throw error;
      return (data || []) as ProcessCluster[];
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
      queryClient.invalidateQueries({ queryKey: ["business-context"] });
    } catch {
      toast.error("Failed to analyze processes");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSegment = async () => {
    setIsSegmenting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/segment-processes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ user_id: user?.id }),
        }
      );
      if (!response.ok) throw new Error("Segmentation failed");
      const data = await response.json();
      toast.success(`Detected ${data.clusters_created} processes from today's activity.`);
      queryClient.invalidateQueries({ queryKey: ["process-clusters"] });
    } catch {
      toast.error("Failed to segment activity");
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleClusterAction = async (clusterId: string, status: string) => {
    const { error } = await supabase.from("process_clusters").update({ status }).eq("id", clusterId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["process-clusters"] });
      toast.success(status === "confirmed" ? "Process confirmed" : "Process dismissed");
    }
  };

  const formatClusterTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SOPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSops ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.publishedCount ?? 0} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Steps</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgStepsPerProcess ?? 0}</div>
            <p className="text-xs text-muted-foreground">Per process</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayEvents ?? 0}</div>
            <p className="text-xs text-muted-foreground">Monitored actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.warningCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">Flagged steps</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Daily Activity
              </CardTitle>
              <CardDescription>AI-detected processes from today's browser monitoring</CardDescription>
            </div>
            <Button onClick={handleSegment} disabled={isSegmenting} variant="outline" size="sm">
              {isSegmenting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
              {isSegmenting ? "Segmenting..." : "Run Segmentation"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingClusters ? (
            <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : !clusters || clusters.filter((c) => c.status !== "dismissed").length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><Activity className="h-8 w-8 text-muted-foreground" /></div>
              <p className="text-muted-foreground mb-2">No processes detected yet</p>
              <p className="text-sm text-muted-foreground">Enable always-on monitoring in the extension, then run segmentation to detect processes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clusters.filter((c) => c.status !== "dismissed").map((cluster) => (
                <div key={cluster.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{cluster.title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        cluster.confidence_score >= 0.7 ? "bg-green-500/15 text-green-500"
                        : cluster.confidence_score >= 0.4 ? "bg-yellow-500/15 text-yellow-500"
                        : "bg-red-500/15 text-red-500"
                      }`}>{Math.round(cluster.confidence_score * 100)}%</span>
                      {cluster.status === "confirmed" && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-500"><CheckCircle className="h-3 w-3" /> Confirmed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatClusterTime(cluster.start_time)} – {formatClusterTime(cluster.end_time)}</span>
                      <span>·</span>
                      <span>{cluster.event_count} events</span>
                    </div>
                    {cluster.description && <p className="text-xs text-muted-foreground mt-1">{cluster.description}</p>}
                  </div>
                  {cluster.status === "detected" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleClusterAction(cluster.id, "confirmed")}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleClusterAction(cluster.id, "dismissed")}>
                        <XCircle className="h-3 w-3 mr-1" /> Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Map + Recommendations */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProcessMap steps={sampleSteps?.steps || []} title={sampleSteps?.title} isLoading={isLoadingSteps} />
        <InsightsPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      </div>
    </div>
  );
}
