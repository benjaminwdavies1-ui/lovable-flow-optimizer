import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Square, 
  Plus, 
  Trash2, 
  GripVertical, 
  AlertTriangle,
  Save,
  FileText,
  Image,
  MousePointer,
  Keyboard,
  ArrowRight,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecordingStep {
  id: string;
  orderNumber: number;
  actionType: "click" | "type" | "navigate" | "scroll" | "custom";
  instructionText: string;
  url?: string;
  screenshotUrl?: string;
  hasWarning: boolean;
  warningText?: string;
  isRedacted: boolean;
}

const actionTypeConfig = {
  click: { label: "Click", icon: MousePointer, color: "bg-blue-500" },
  type: { label: "Type", icon: Keyboard, color: "bg-green-500" },
  navigate: { label: "Navigate", icon: ArrowRight, color: "bg-purple-500" },
  scroll: { label: "Scroll", icon: GripVertical, color: "bg-orange-500" },
  custom: { label: "Custom", icon: FileText, color: "bg-gray-500" },
};

export default function RecordingNew() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState("Untitled Recording");
  const [steps, setSteps] = useState<RecordingStep[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setStartTime(new Date());
    toast.success("Recording started! Add steps manually below.");
    
    // Start timer
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    toast.success(`Recording stopped with ${steps.length} steps captured.`);
  }, [steps.length]);

  const addStep = useCallback((actionType: RecordingStep["actionType"] = "custom") => {
    const newStep: RecordingStep = {
      id: `step-${Date.now()}`,
      orderNumber: steps.length + 1,
      actionType,
      instructionText: "",
      hasWarning: false,
      isRedacted: false,
    };
    setSteps((prev) => [...prev, newStep]);
  }, [steps.length]);

  const updateStep = useCallback((id: string, updates: Partial<RecordingStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
    );
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((step) => step.id !== id);
      return filtered.map((step, index) => ({ ...step, orderNumber: index + 1 }));
    });
  }, []);

  const toggleWarning = useCallback((id: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, hasWarning: !step.hasWarning } : step
      )
    );
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    if (steps.length === 0) {
      toast.error("Please add at least one step before saving.");
      return;
    }
    
    // TODO: Save to Supabase
    toast.success("Recording saved successfully!");
    navigate("/recordings");
  };

  const handleConvertToSOP = async () => {
    if (steps.length === 0) {
      toast.error("Please add at least one step before converting.");
      return;
    }
    
    // TODO: Create SOP from recording
    toast.success("SOP created from recording!");
    navigate("/sops");
  };

  return (
    <AppLayout
      title="New Recording"
      description="Capture your workflow step by step"
      actions={
        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <>
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Recording
              </Button>
              <Button onClick={handleConvertToSOP}>
                <FileText className="mr-2 h-4 w-4" />
                Convert to SOP
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Recording Controls */}
        <Card className={cn(
          "transition-all",
          isRecording && "border-destructive/50 bg-destructive/5"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                  isRecording 
                    ? "bg-destructive text-destructive-foreground animate-pulse" 
                    : "bg-primary text-primary-foreground"
                )}>
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isRecording ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        Recording in Progress
                      </>
                    ) : steps.length > 0 ? (
                      "Recording Paused"
                    ) : (
                      "Ready to Record"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isRecording 
                      ? "Add steps as you perform your workflow"
                      : "Start recording to capture your workflow"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isRecording && (
                  <div className="flex items-center gap-2 text-lg font-mono">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatTime(elapsedTime)}
                  </div>
                )}
                {isRecording ? (
                  <Button variant="destructive" size="lg" onClick={stopRecording}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button size="lg" onClick={startRecording}>
                    <Video className="mr-2 h-4 w-4" />
                    {steps.length > 0 ? "Resume" : "Start Recording"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          {/* Recording Title */}
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="title">Recording Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {steps.length} step{steps.length !== 1 ? "s" : ""} captured
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Step Buttons */}
        {isRecording && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Step</CardTitle>
              <CardDescription>Click to add a new step type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(actionTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => addStep(type as RecordingStep["actionType"])}
                      className="gap-2"
                    >
                      <div className={cn("h-2 w-2 rounded-full", config.color)} />
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps List */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Captured Steps</CardTitle>
              <CardDescription>
                Edit step details, add warnings, or reorder as needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step) => {
                  const config = actionTypeConfig[step.actionType];
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "rounded-lg border p-4 transition-all",
                        step.hasWarning && "border-warning bg-warning/5"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                          {step.orderNumber}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <div className={cn("h-2 w-2 rounded-full", config.color)} />
                              {config.label}
                            </Badge>
                            {step.hasWarning && (
                              <Badge variant="outline" className="text-warning border-warning">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Warning
                              </Badge>
                            )}
                          </div>
                          
                          <Textarea
                            value={step.instructionText}
                            onChange={(e) => updateStep(step.id, { instructionText: e.target.value })}
                            placeholder="Describe what to do in this step..."
                            className="min-h-[60px] resize-none"
                          />
                          
                          {step.actionType === "navigate" && (
                            <Input
                              value={step.url || ""}
                              onChange={(e) => updateStep(step.id, { url: e.target.value })}
                              placeholder="https://example.com/page"
                              className="mt-2"
                            />
                          )}
                          
                          {step.hasWarning && (
                            <Textarea
                              value={step.warningText || ""}
                              onChange={(e) => updateStep(step.id, { warningText: e.target.value })}
                              placeholder="Enter warning message..."
                              className="mt-2 min-h-[40px] resize-none border-warning"
                            />
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleWarning(step.id)}
                            className={cn(step.hasWarning && "text-warning")}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(step.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {steps.length === 0 && !isRecording && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No steps captured yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Click "Start Recording" to begin capturing your workflow. 
                Add steps manually as you perform each action.
              </p>
              <Button onClick={startRecording}>
                <Video className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
