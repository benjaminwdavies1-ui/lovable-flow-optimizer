import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Square, Save, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { RecordingStep, RecordingStepData } from "@/components/recording/RecordingStep";
import { StepTypeButtons, ActionType, actionTypeConfig } from "@/components/recording/StepTypeButtons";

export default function RecordingNew() {
  const navigate = useNavigate();
  const { captureScreen, isCapturing } = useScreenCapture();
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState("Untitled Recording");
  const [steps, setSteps] = useState<RecordingStepData[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    toast.success("Recording started! Add steps to capture your workflow with screenshots.");
    
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    toast.success(`Recording stopped with ${steps.length} steps captured.`);
  }, [steps.length]);

  const addStep = useCallback(async (actionType: ActionType = "custom") => {
    // Capture screenshot before adding step
    const screenshotUrl = await captureScreen();
    
    const newStep: RecordingStepData = {
      id: `step-${Date.now()}`,
      orderNumber: steps.length + 1,
      actionType,
      instructionText: "",
      screenshotUrl: screenshotUrl || undefined,
      hasWarning: false,
      isRedacted: false,
    };
    
    setSteps((prev) => [...prev, newStep]);
    
    if (screenshotUrl) {
      toast.success("Step added with screenshot!");
    } else {
      toast.success("Step added.");
    }
  }, [steps.length, captureScreen]);

  const updateStep = useCallback((id: string, updates: Partial<RecordingStepData>) => {
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
    
    // TODO: Save to database
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
      description="Capture your workflow step by step with automatic screenshots"
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
                      ? "Each step captures a screenshot automatically"
                      : "Start recording to capture your workflow with screenshots"}
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
              <CardDescription>Click to add a step with automatic screenshot capture</CardDescription>
            </CardHeader>
            <CardContent>
              <StepTypeButtons onAddStep={addStep} isCapturing={isCapturing} />
            </CardContent>
          </Card>
        )}

        {/* Steps List */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Captured Steps</CardTitle>
              <CardDescription>
                Edit step details, view screenshots, or add warnings as needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step) => (
                  <RecordingStep
                    key={step.id}
                    step={step}
                    actionConfig={actionTypeConfig[step.actionType]}
                    onUpdate={updateStep}
                    onRemove={removeStep}
                    onToggleWarning={toggleWarning}
                  />
                ))}
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
                Click "Start Recording" to begin. Each step you add will automatically 
                capture a screenshot of your current screen.
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
