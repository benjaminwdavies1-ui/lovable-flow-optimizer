import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Square, Save, FileText, Clock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { RecordingStep, RecordingStepData } from "@/components/recording/RecordingStep";
import { StepTypeButtons, ActionType, actionTypeConfig } from "@/components/recording/StepTypeButtons";
import { useAuth } from "@/contexts/AuthContext";
import {
  createRecording,
  updateRecording,
  createStep,
  updateStep as updateStepInDb,
  deleteStep as deleteStepFromDb,
  uploadScreenshot,
} from "@/services/recordingService";
import type { Tables } from "@/integrations/supabase/types";

type Recording = Tables<"recordings">;

export default function RecordingNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { captureScreen, isCapturing, generateInstruction } = useScreenCapture();
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("Untitled Recording");
  const [steps, setSteps] = useState<RecordingStepData[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to create recordings.");
      navigate("/auth");
      return;
    }

    // Create recording in database
    const recording = await createRecording(title, user.id);
    if (!recording) {
      toast.error("Failed to start recording. Please try again.");
      return;
    }

    setCurrentRecording(recording);
    setIsRecording(true);
    startTimeRef.current = new Date();
    toast.success("Recording started! Add steps to capture your workflow.");

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [user, title, navigate]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);

    // Update recording in database
    if (currentRecording) {
      await updateRecording(currentRecording.id, {
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: elapsedTime,
        step_count: steps.length,
      });
    }

    toast.success(`Recording stopped with ${steps.length} steps captured.`);
  }, [currentRecording, elapsedTime, steps.length]);

  const addStep = useCallback(async (actionType: ActionType = "custom") => {
    if (!user || !currentRecording) {
      toast.error("Recording not initialized.");
      return;
    }

    // Generate instruction from last clicked element
    const instruction = generateInstruction(actionType);

    // Capture screenshot
    const screenshotDataUrl = await captureScreen();

    const stepId = crypto.randomUUID();
    const orderNumber = steps.length + 1;

    // Upload screenshot if captured
    let screenshotUrl: string | undefined;
    if (screenshotDataUrl) {
      const uploadedUrl = await uploadScreenshot(
        user.id,
        currentRecording.id,
        stepId,
        screenshotDataUrl
      );
      screenshotUrl = uploadedUrl || undefined;
    }

    // Save step to database
    const savedStep = await createStep({
      id: stepId,
      recording_id: currentRecording.id,
      order_number: orderNumber,
      action_type: actionType,
      instruction_text: instruction,
      screenshot_url: screenshotUrl,
      has_warning: false,
      is_redacted: false,
    });

    if (!savedStep) {
      toast.error("Failed to save step.");
      return;
    }

    const newStep: RecordingStepData = {
      id: savedStep.id,
      orderNumber,
      actionType: actionType as RecordingStepData["actionType"],
      instructionText: instruction,
      screenshotUrl,
      hasWarning: false,
      isRedacted: false,
    };

    setSteps((prev) => [...prev, newStep]);
    toast.success("Step captured!");
  }, [user, currentRecording, steps.length, captureScreen, generateInstruction]);

  const handleUpdateStep = useCallback(async (id: string, updates: Partial<RecordingStepData>) => {
    // Update local state
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
    );

    // Update in database
    const dbUpdates: Record<string, unknown> = {};
    if (updates.instructionText !== undefined) dbUpdates.instruction_text = updates.instructionText;
    if (updates.hasWarning !== undefined) dbUpdates.has_warning = updates.hasWarning;
    if (updates.warningText !== undefined) dbUpdates.warning_text = updates.warningText;
    if (updates.isRedacted !== undefined) dbUpdates.is_redacted = updates.isRedacted;
    if (updates.url !== undefined) dbUpdates.url = updates.url;

    if (Object.keys(dbUpdates).length > 0) {
      await updateStepInDb(id, dbUpdates as Partial<Tables<"steps">>);
    }
  }, []);

  const removeStep = useCallback(async (id: string) => {
    // Delete from database
    const success = await deleteStepFromDb(id);
    if (!success) {
      toast.error("Failed to delete step.");
      return;
    }

    // Update local state and reorder
    setSteps((prev) => {
      const filtered = prev.filter((step) => step.id !== id);
      return filtered.map((step, index) => ({ ...step, orderNumber: index + 1 }));
    });
  }, []);

  const toggleWarning = useCallback((id: string) => {
    setSteps((prev) => {
      const step = prev.find((s) => s.id === id);
      if (step) {
        handleUpdateStep(id, { hasWarning: !step.hasWarning });
      }
      return prev.map((s) =>
        s.id === id ? { ...s, hasWarning: !s.hasWarning } : s
      );
    });
  }, [handleUpdateStep]);

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

    setIsSaving(true);

    // Update recording with final details
    if (currentRecording) {
      await updateRecording(currentRecording.id, {
        title,
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: elapsedTime,
        step_count: steps.length,
      });
    }

    setIsSaving(false);
    toast.success("Recording saved successfully!");
    navigate("/recordings");
  };

  const handleConvertToSOP = async () => {
    if (steps.length === 0) {
      toast.error("Please add at least one step before converting.");
      return;
    }

    if (!user || !currentRecording) {
      toast.error("Recording not initialized.");
      return;
    }

    setIsSaving(true);

    // Save recording first
    await updateRecording(currentRecording.id, {
      title,
      status: "completed",
      ended_at: new Date().toISOString(),
      duration_seconds: elapsedTime,
      step_count: steps.length,
    });

    // Import and call createSOPFromRecording
    const { createSOPFromRecording } = await import("@/services/sopService");
    const sop = await createSOPFromRecording(currentRecording.id, user.id);
    
    setIsSaving(false);

    if (sop) {
      toast.success("SOP created from recording!");
      navigate(`/sops/${sop.id}`);
    } else {
      toast.error("Failed to create SOP. Please try again.");
    }
  };

  return (
    <AppLayout
      title="New Recording"
      description="Capture your workflow step by step with automatic screenshots"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {steps.length > 0 && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Recording
              </Button>
              <Button onClick={handleConvertToSOP} disabled={isSaving}>
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
                  disabled={isRecording}
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
                    onUpdate={handleUpdateStep}
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
