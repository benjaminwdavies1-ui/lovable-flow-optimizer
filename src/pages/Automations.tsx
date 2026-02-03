import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AutomationSuggestionsPanel } from "@/components/automation/AutomationSuggestionsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, FileText, TrendingUp, CheckCircle } from "lucide-react";

export default function Automations() {
  const { user } = useAuth();
  const [selectedSopId, setSelectedSopId] = useState<string | undefined>();

  const { data: sops } = useQuery({
    queryKey: ["sops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sops")
        .select("id, title, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["automation-stats"],
    queryFn: async () => {
      const { data: suggestions, error } = await supabase
        .from("automation_suggestions")
        .select("status, estimated_time_saved");
      
      if (error) throw error;

      const total = suggestions?.length || 0;
      const implemented = suggestions?.filter(s => s.status === "implemented").length || 0;
      const pending = suggestions?.filter(s => s.status === "pending").length || 0;

      return { total, implemented, pending };
    },
    enabled: !!user,
  });

  return (
    <AppLayout
      title="Automations"
      description="AI-powered automation suggestions for your workflows"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Automation opportunities found
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Implemented</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.implemented || 0}</div>
              <p className="text-xs text-muted-foreground">
                Automations completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting implementation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SOP Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select SOP to Analyze
            </CardTitle>
            <CardDescription>
              Choose a Standard Operating Procedure to analyze for automation opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSopId} onValueChange={setSelectedSopId}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Select an SOP..." />
              </SelectTrigger>
              <SelectContent>
                {sops?.map((sop) => (
                  <SelectItem key={sop.id} value={sop.id}>
                    <div className="flex items-center gap-2">
                      <span>{sop.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {sop.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                {(!sops || sops.length === 0) && (
                  <SelectItem value="none" disabled>
                    No SOPs available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Automation Suggestions */}
        <AutomationSuggestionsPanel sopId={selectedSopId} />
      </div>
    </AppLayout>
  );
}
