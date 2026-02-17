import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { BusinessContextCard, type BusinessContext } from "@/components/insights/BusinessContextCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";

const contextTypes = [
  { value: "all", label: "All" },
  { value: "process_pattern", label: "Patterns" },
  { value: "business_rule", label: "Rules" },
  { value: "optimization_insight", label: "Insights" },
];

export default function BusinessKnowledge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: businessContext, isLoading } = useQuery({
    queryKey: ["business-context", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_context").select("*").eq("user_id", user?.id)
        .order("confidence_score", { ascending: false });
      if (error) throw error;
      return data as BusinessContext[];
    },
    enabled: !!user?.id,
  });

  const filtered = filter === "all"
    ? businessContext
    : businessContext?.filter((c) => c.context_type === filter);

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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Business Context - takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Business Knowledge
                  </CardTitle>
                  <CardDescription>Patterns and insights learned from your processes</CardDescription>
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing} variant="outline" size="sm">
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                {contextTypes.map((t) => (
                  <Badge
                    key={t.value}
                    variant={filter === t.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilter(t.value)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
                </div>
              ) : !filtered?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4"><Brain className="h-8 w-8 text-muted-foreground" /></div>
                  <p className="text-muted-foreground mb-2">No business context yet</p>
                  <p className="text-sm text-muted-foreground">Record some workflows and run analysis to build your knowledge base.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filtered.map((ctx) => (
                    <BusinessContextCard key={ctx.id} context={ctx} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations sidebar */}
        <div>
          <InsightsPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  );
}
