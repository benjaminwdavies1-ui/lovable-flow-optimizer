import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Video, Loader2, ExternalLink, MousePointer, Keyboard, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getRecordingWithSteps, type Recording, type Step } from "@/services/recordingService";
import { createSOPFromRecording } from "@/services/sopService";
import { cn } from "@/lib/utils";

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  click: <MousePointer className="h-4 w-4" />,
  type: <Keyboard className="h-4 w-4" />,
  navigate: <ExternalLink className="h-4 w-4" />,
  decision: <GitBranch className="h-4 w-4" />,
};

export default function RecordingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      const result = await getRecordingWithSteps(id);
      if (result) {
        setRecording(result.recording);
        setSteps(result.steps);
      }
      setIsLoading(false);
    }
    load();
  }, [id]);

  const handleConvertToSOP = async () => {
    if (!user || !id) return;
    setIsConverting(true);
    const sop = await createSOPFromRecording(id, user.id);
    if (sop) {
      toast.success("SOP created successfully!");
      navigate(`/sops/${sop.id}`);
    } else {
      toast.error("Failed to convert to SOP");
    }
    setIsConverting(false);
  };

  if (isLoading) {
    return (
      <AppLayout title="Recording">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!recording) {
    return (
      <AppLayout title="Recording Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Recording not found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This recording may have been deleted or doesn't exist.
          </p>
          <Button asChild variant="outline">
            <Link to="/recordings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recordings
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={recording.title}
      description={`Recorded ${formatDate(recording.created_at)}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/recordings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          {recording.status === "completed" && (
            <Button onClick={handleConvertToSOP} disabled={isConverting}>
              {isConverting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Convert to SOP
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Recording Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant="secondary"
                  className={cn(
                    recording.status === "completed" && "bg-success text-success-foreground",
                    recording.status === "in_progress" && "bg-info text-info-foreground",
                    recording.status === "converted" && "border-primary text-primary bg-primary/10"
                  )}
                >
                  {recording.status === "in_progress" ? "In Progress" : recording.status === "completed" ? "Completed" : "Converted"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Steps</p>
                <p className="font-medium">{steps.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(recording.duration_seconds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Steps ({steps.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No steps recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {actionTypeIcons[step.action_type] || <MousePointer className="h-4 w-4" />}
                        <span className="text-sm font-medium capitalize">{step.action_type}</span>
                        {step.is_decision && (
                          <Badge variant="outline" className="text-xs">Decision</Badge>
                        )}
                      </div>
                      {step.instruction_text && (
                        <p className="text-sm text-muted-foreground">{step.instruction_text}</p>
                      )}
                      {step.url && (
                        <p className="text-xs text-muted-foreground truncate mt-1">{step.url}</p>
                      )}
                    </div>
                    {step.screenshot_url && (
                      <img
                        src={step.screenshot_url}
                        alt={`Step ${index + 1}`}
                        className="h-16 w-24 rounded border object-cover shrink-0"
                      />
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
