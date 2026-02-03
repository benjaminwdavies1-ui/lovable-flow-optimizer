import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RecommendationCard, type Recommendation } from "./RecommendationCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Lightbulb, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InsightsPanelProps {
  onAnalyze?: () => Promise<void>;
  isAnalyzing?: boolean;
}

export function InsightsPanel({ onAnalyze, isAnalyzing }: InsightsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["ai-recommendations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_recommendations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Recommendation[];
    },
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "applied" | "dismissed";
    }) => {
      const { error } = await supabase
        .from("ai_recommendations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
      toast.success("Recommendation updated");
    },
    onError: () => {
      toast.error("Failed to update recommendation");
    },
  });

  const filteredRecommendations = recommendations?.filter((r) => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeTab === "applied") return r.status === "applied";
    if (activeTab === "dismissed") return r.status === "dismissed";
    return true;
  });

  const pendingCount = recommendations?.filter((r) => r.status === "pending").length ?? 0;
  const appliedCount = recommendations?.filter((r) => r.status === "applied").length ?? 0;
  const dismissedCount = recommendations?.filter((r) => r.status === "dismissed").length ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Recommendations
            </CardTitle>
            <CardDescription className="mt-1">
              Suggestions to optimize your workflows
            </CardDescription>
          </div>
          {onAnalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Analyze
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="applied" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Applied ({appliedCount})
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Dismissed ({dismissedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredRecommendations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Lightbulb className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "pending"
                    ? "No pending recommendations. Click Analyze to scan your processes."
                    : `No ${activeTab} recommendations yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecommendations?.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onApply={(id) => updateStatus.mutate({ id, status: "applied" })}
                    onDismiss={(id) => updateStatus.mutate({ id, status: "dismissed" })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
