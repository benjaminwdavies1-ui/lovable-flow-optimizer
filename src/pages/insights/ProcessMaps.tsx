import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProcessMap, type Step } from "@/components/process-map/ProcessMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default function ProcessMaps() {
  const { user } = useAuth();
  const [selectedSopId, setSelectedSopId] = useState<string | undefined>();

  const { data: sops } = useQuery({
    queryKey: ["sops-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sops").select("id, title, status").eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: steps, isLoading: isLoadingSteps } = useQuery({
    queryKey: ["sop-steps-map", selectedSopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sop_steps").select("*").eq("sop_id", selectedSopId!)
        .order("order_number");
      if (error) throw error;
      return data as unknown as Step[];
    },
    enabled: !!selectedSopId,
  });

  const selectedTitle = sops?.find((s) => s.id === selectedSopId)?.title || "Select a process";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Process
          </CardTitle>
          <CardDescription>Choose an SOP to view its interactive process map</CardDescription>
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
                    <Badge variant="outline" className="text-xs">{sop.status}</Badge>
                  </div>
                </SelectItem>
              ))}
              {(!sops || sops.length === 0) && (
                <SelectItem value="none" disabled>No SOPs available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <ProcessMap
        steps={steps || []}
        title={selectedSopId ? selectedTitle : "Process Map"}
        isLoading={isLoadingSteps && !!selectedSopId}
      />
    </div>
  );
}
