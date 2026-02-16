import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Plus, 
  Trash2, 
  GripVertical, 
  AlertTriangle,
  Save,
  Send,
  Diamond
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DecisionBranchEditor, type BranchStep } from "@/components/recording/DecisionBranchEditor";

interface SOPStep {
  id: string;
  orderNumber: number;
  title: string;
  description: string;
  screenshotUrl?: string;
  showScreenshot: boolean;
  hasWarning: boolean;
  warningText?: string;
  isRedacted: boolean;
  isDecision: boolean;
  decisionMode: "simple" | "split";
  yesBranchSteps: BranchStep[];
  noBranchSteps: BranchStep[];
}

export default function SOPNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SOPStep[]>([]);

  const addStep = useCallback(() => {
    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      orderNumber: steps.length + 1,
      title: "",
      description: "",
      showScreenshot: true,
      hasWarning: false,
      isRedacted: false,
      isDecision: false,
      decisionMode: "simple",
      yesBranchSteps: [],
      noBranchSteps: [],
    };
    setSteps((prev) => [...prev, newStep]);
  }, [steps.length]);

  const updateStep = useCallback((id: string, updates: Partial<SOPStep>) => {
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

  const toggleDecision = useCallback((id: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, isDecision: !step.isDecision } : step
      )
    );
  }, []);

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your SOP.");
      return;
    }
    toast.success("SOP saved as draft!");
    navigate("/sops");
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your SOP.");
      return;
    }
    if (steps.length === 0) {
      toast.error("Please add at least one step before publishing.");
      return;
    }
    toast.success("SOP published successfully!");
    navigate("/sops");
  };

  return (
    <AppLayout
      title="Create SOP"
      description="Build a new standard operating procedure"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/sops")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={handlePublish}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SOP Details</CardTitle>
            <CardDescription>Enter the basic information for your procedure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sop-title">Title</Label>
              <Input id="sop-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Customer Onboarding Process" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sop-description">Description</Label>
              <Textarea id="sop-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe what this SOP covers..." className="min-h-[80px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Steps</CardTitle>
                <CardDescription>Add the steps for your procedure</CardDescription>
              </div>
              <Button onClick={addStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No steps added yet. Click "Add Step" to get started.</p>
                <Button variant="outline" onClick={addStep}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      step.hasWarning && "border-warning bg-warning/5",
                      step.isDecision && "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium",
                          step.isDecision ? "bg-yellow-500 text-white" : "bg-primary text-primary-foreground"
                        )}>
                          {step.isDecision ? <Diamond className="h-4 w-4" /> : step.orderNumber}
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(step.id, { title: e.target.value })}
                          placeholder={step.isDecision ? "Decision question..." : "Step title..."}
                          className="font-medium"
                        />
                        
                        <Textarea
                          value={step.description}
                          onChange={(e) => updateStep(step.id, { description: e.target.value })}
                          placeholder={step.isDecision ? "Describe the decision criteria..." : "Describe what to do in this step..."}
                          className="min-h-[60px] resize-none"
                        />
                        
                        {step.hasWarning && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                            <Textarea
                              value={step.warningText || ""}
                              onChange={(e) => updateStep(step.id, { warningText: e.target.value })}
                              placeholder="Enter warning message..."
                              className="min-h-[40px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                            />
                          </div>
                        )}

                        {step.isDecision && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Label className="text-xs text-muted-foreground">Mode:</Label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateStep(step.id, { decisionMode: "simple" })}
                                  className={cn("px-2 py-1 text-xs rounded", step.decisionMode === "simple" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                                >
                                  Simple
                                </button>
                                <button
                                  onClick={() => updateStep(step.id, { decisionMode: "split" })}
                                  className={cn("px-2 py-1 text-xs rounded", step.decisionMode === "split" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                                >
                                  Split
                                </button>
                              </div>
                            </div>

                            {step.decisionMode === "split" && (
                              <DecisionBranchEditor
                                yesBranchSteps={step.yesBranchSteps}
                                noBranchSteps={step.noBranchSteps}
                                onYesBranchChange={(s) => updateStep(step.id, { yesBranchSteps: s })}
                                onNoBranchChange={(s) => updateStep(step.id, { noBranchSteps: s })}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDecision(step.id)}
                          className={cn(step.isDecision && "text-yellow-600")}
                          title={step.isDecision ? "Remove decision" : "Make decision point"}
                        >
                          <Diamond className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWarning(step.id)}
                          className={cn(step.hasWarning && "text-warning")}
                          title={step.hasWarning ? "Remove warning" : "Add warning"}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(step.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete step"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addStep} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Step
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
