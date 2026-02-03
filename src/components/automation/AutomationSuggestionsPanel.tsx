import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AutomationSuggestionCard } from "./AutomationSuggestionCard";
import { Lightbulb, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AutomationSuggestionsPanelProps {
  sopId?: string;
}

export function AutomationSuggestionsPanel({ sopId }: AutomationSuggestionsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["automation-suggestions", sopId],
    queryFn: async () => {
      let query = supabase
        .from("automation_suggestions")
        .select("*")
        .order("created_at", { ascending: false });

      if (sopId) {
        query = query.eq("sop_id", sopId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("automation_suggestions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-suggestions"] });
      toast.success("Status updated");
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    },
  });

  const handleAnalyzeSOP = async () => {
    if (!sopId || !user) {
      toast.error("Please select an SOP to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-automations", {
        body: { sop_id: sopId, user_id: user.id },
      });

      if (error) throw error;

      toast.success(data.message || "Analysis complete!");
      queryClient.invalidateQueries({ queryKey: ["automation-suggestions", sopId] });
    } catch (error) {
      console.error("Error analyzing SOP:", error);
      toast.error("Failed to analyze SOP for automations");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const activeSuggestions = suggestions?.filter((s) => s.status !== "dismissed") || [];
  const implementedCount = suggestions?.filter((s) => s.status === "implemented").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Automation Suggestions</CardTitle>
              <CardDescription>
                AI-powered recommendations to automate your workflows
              </CardDescription>
            </div>
          </div>
          {sopId && (
            <Button onClick={handleAnalyzeSOP} disabled={isAnalyzing} size="sm">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : activeSuggestions.length > 0 ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-analyze
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze SOP
                </>
              )}
            </Button>
          )}
        </div>
        {activeSuggestions.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {activeSuggestions.length} suggestion{activeSuggestions.length !== 1 ? "s" : ""} • 
            {implementedCount} implemented
          </p>
        )}
      </CardHeader>
      <CardContent>
        {activeSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No suggestions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {sopId 
                ? "Click 'Analyze SOP' to get AI-powered automation recommendations"
                : "Select an SOP to analyze for automation opportunities"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSuggestions.map((suggestion) => (
              <AutomationSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
