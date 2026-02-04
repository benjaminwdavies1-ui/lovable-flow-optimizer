import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Edit, 
  Share2, 
  Download, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Image as ImageIcon
} from "lucide-react";
import { getSOPWithSteps, type SOP, type SOPStep } from "@/services/sopService";

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SOPView() {
  const { id } = useParams<{ id: string }>();
  const [sop, setSOP] = useState<SOP | null>(null);
  const [steps, setSteps] = useState<SOPStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadSOP() {
      if (!id) return;
      setIsLoading(true);
      const data = await getSOPWithSteps(id);
      if (data) {
        setSOP(data.sop);
        setSteps(data.steps);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }
    loadSOP();
  }, [id]);

  if (isLoading) {
    return (
      <AppLayout title="" description="">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !sop) {
    return (
      <AppLayout title="SOP Not Found" description="">
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">SOP not found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The SOP you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link to="/sops">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to SOPs
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

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
                  <Badge className={sop.status === "published" ? "bg-success text-success-foreground" : "bg-warning/10 text-warning border-warning/20"}>
                    {sop.status === "published" ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline">v{sop.version || 1}</Badge>
                </div>
                <CardTitle className="text-2xl">{sop.title}</CardTitle>
                {sop.description && (
                  <CardDescription className="text-base">
                    {sop.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDate(sop.updated_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>{steps.length} steps</span>
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
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No steps in this SOP yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {steps.map((step, index) => (
                  <div key={step.id}>
                    <div className="flex gap-4 py-6">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                          {step.order_number}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <h3 className="font-semibold text-lg mb-2">
                          {step.title || `Step ${step.order_number}`}
                        </h3>
                        {step.description && (
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        )}
                        
                        {step.screenshot_url && step.show_screenshot && (
                          <div className="mt-4 rounded-lg border overflow-hidden">
                            <img 
                              src={step.screenshot_url} 
                              alt={`Step ${step.order_number} screenshot`}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {step.has_warning && step.warning_text && (
                          <div className="flex items-start gap-3 mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-warning mb-1">Warning</p>
                              <p className="text-sm text-muted-foreground">
                                {step.warning_text}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <Separator className="ml-14" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
