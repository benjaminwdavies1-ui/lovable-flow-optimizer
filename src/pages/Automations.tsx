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

// Mock SOPs for testing when not authenticated
const mockSops = [
  {
    id: "mock-sop-1",
    title: "Customer Onboarding Process",
    status: "published",
    steps: [
      { id: "step-1", order_number: 1, title: "Receive customer signup form", description: "Check the inbox for new customer signup submissions from the website form." },
      { id: "step-2", order_number: 2, title: "Create customer account in CRM", description: "Open Salesforce and manually create a new contact record with customer details from the form." },
      { id: "step-3", order_number: 3, title: "Send welcome email", description: "Open Gmail, compose a new email using the welcome template, personalize it with customer name, and send." },
      { id: "step-4", order_number: 4, title: "Add to email newsletter list", description: "Log into Mailchimp and manually add the customer email to the newsletter subscriber list." },
      { id: "step-5", order_number: 5, title: "Schedule onboarding call", description: "Open Google Calendar and create a meeting invite for the customer onboarding session." },
      { id: "step-6", order_number: 6, title: "Create project folder", description: "Go to Google Drive and create a new shared folder for the customer with standard template documents." },
      { id: "step-7", order_number: 7, title: "Update tracking spreadsheet", description: "Open the customer tracking Google Sheet and add a new row with customer details and onboarding status." },
    ],
  },
  {
    id: "mock-sop-2",
    title: "Invoice Processing Workflow",
    status: "draft",
    steps: [
      { id: "step-8", order_number: 1, title: "Receive invoice email", description: "Check the accounts@company.com inbox for new invoice emails from vendors." },
      { id: "step-9", order_number: 2, title: "Download invoice PDF", description: "Download the invoice attachment and save to the Invoices folder on Google Drive." },
      { id: "step-10", order_number: 3, title: "Enter invoice in accounting system", description: "Log into QuickBooks and manually enter the invoice details including vendor, amount, and due date." },
      { id: "step-11", order_number: 4, title: "Get manager approval", description: "Send an email to the department manager requesting approval for invoices over $500." },
      { id: "step-12", order_number: 5, title: "Schedule payment", description: "Once approved, schedule the payment in the banking portal for the due date." },
    ],
  },
];

export default function Automations() {
  const { user } = useAuth();
  const [selectedSopId, setSelectedSopId] = useState<string | undefined>();

  const { data: dbSops } = useQuery({
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

  // Use mock SOPs when not authenticated or no data
  const sops = (dbSops && dbSops.length > 0) ? dbSops : mockSops;

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
        <AutomationSuggestionsPanel 
          sopId={selectedSopId} 
          mockSteps={mockSops.find(s => s.id === selectedSopId)?.steps}
        />
      </div>
    </AppLayout>
  );
}
