import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Edit, 
  Share2, 
  Download, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock SOP data - will be replaced with Supabase fetch
const mockSOP = {
  id: "1",
  title: "Customer Order Processing",
  description: "Complete guide to processing customer orders in the CRM system. This procedure ensures consistent order handling across all team members.",
  status: "published" as const,
  version: 2,
  createdAt: "2024-01-10T10:30:00",
  updatedAt: "2024-01-15T10:30:00",
  author: "John Doe",
  steps: [
    {
      id: "1",
      orderNumber: 1,
      title: "Log into the CRM system",
      description: "Navigate to crm.example.com and enter your credentials. Make sure you're using the production environment, not staging.",
      hasWarning: false,
    },
    {
      id: "2",
      orderNumber: 2,
      title: "Navigate to Orders section",
      description: "Click on 'Orders' in the left sidebar, then select 'New Orders' to view pending orders that need processing.",
      hasWarning: false,
    },
    {
      id: "3",
      orderNumber: 3,
      title: "Review order details",
      description: "Click on the order to open the detail view. Verify the customer information, shipping address, and ordered items match the original request.",
      hasWarning: true,
      warningText: "Double-check the shipping address! Incorrect addresses are the #1 cause of delivery issues.",
    },
    {
      id: "4",
      orderNumber: 4,
      title: "Verify payment status",
      description: "Check the payment section to confirm the payment has been received and cleared. Orders should only be processed after payment confirmation.",
      hasWarning: false,
    },
    {
      id: "5",
      orderNumber: 5,
      title: "Check inventory availability",
      description: "Navigate to the Inventory tab and verify all items are in stock. If any items are backordered, contact the customer before proceeding.",
      hasWarning: false,
    },
    {
      id: "6",
      orderNumber: 6,
      title: "Process the order",
      description: "Click the 'Process Order' button. Select the appropriate shipping method based on customer preference and delivery timeline.",
      hasWarning: true,
      warningText: "This action cannot be undone. Make sure all details are correct before processing.",
    },
    {
      id: "7",
      orderNumber: 7,
      title: "Send confirmation email",
      description: "The system will automatically send a confirmation email. Verify in the Activity log that the email was sent successfully.",
      hasWarning: false,
    },
  ],
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SOPView() {
  const { id } = useParams<{ id: string }>();
  const sop = mockSOP; // TODO: Fetch from Supabase using id

  return (
    <AppLayout
      title=""
      description=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/sops">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to SOPs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/sops/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-success text-success-foreground">
                    Published
                  </Badge>
                  <Badge variant="outline">v{sop.version}</Badge>
                </div>
                <CardTitle className="text-2xl">{sop.title}</CardTitle>
                <CardDescription className="text-base">
                  {sop.description}
                </CardDescription>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{sop.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDate(sop.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>{sop.steps.length} steps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Procedure Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {sop.steps.map((step, index) => (
                <div key={step.id}>
                  <div className="flex gap-4 py-6">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                        {step.orderNumber}
                      </div>
                      {index < sop.steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      
                      {step.hasWarning && step.warningText && (
                        <div className="flex items-start gap-3 mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-warning mb-1">Warning</p>
                            <p className="text-sm text-muted-foreground">
                              {step.warningText}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < sop.steps.length - 1 && (
                    <Separator className="ml-14" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
