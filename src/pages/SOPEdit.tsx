import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Trash2, 
  GripVertical, 
  AlertTriangle,
  Save,
  Eye,
  Send,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

// Mock SOP data - will be replaced with Supabase fetch
const mockSOP = {
  id: "1",
  title: "Customer Order Processing",
  description: "Complete guide to processing customer orders in the CRM system.",
  status: "published" as const,
  version: 2,
  steps: [
    {
      id: "1",
      orderNumber: 1,
      title: "Log into the CRM system",
      description: "Navigate to crm.example.com and enter your credentials.",
      showScreenshot: true,
      hasWarning: false,
      isRedacted: false,
    },
    {
      id: "2",
      orderNumber: 2,
      title: "Navigate to Orders section",
      description: "Click on 'Orders' in the left sidebar.",
      showScreenshot: true,
      hasWarning: false,
      isRedacted: false,
    },
  ],
};

export default function SOPEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SOPStep[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Load SOP data
  useEffect(() => {
    // TODO: Fetch from Supabase using id
    setTitle(mockSOP.title);
    setDescription(mockSOP.description);
    setSteps(mockSOP.steps);
  }, [id]);

  const addStep = useCallback(() => {
    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      orderNumber: steps.length + 1,
      title: "",
      description: "",
      showScreenshot: true,
      hasWarning: false,
      isRedacted: false,
    };
    setSteps((prev) => [...prev, newStep]);
    setIsDirty(true);
  }, [steps.length]);

  const updateStep = useCallback((stepId: string, updates: Partial<SOPStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
    );
    setIsDirty(true);
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((step) => step.id !== stepId);
      return filtered.map((step, index) => ({ ...step, orderNumber: index + 1 }));
    });
    setIsDirty(true);
  }, []);

  const toggleWarning = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, hasWarning: !step.hasWarning } : step
      )
    );
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your SOP.");
      return;
    }
    
    // TODO: Save to Supabase
    toast.success("Changes saved!");
    setIsDirty(false);
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
    
    // TODO: Save to Supabase and publish
    toast.success("SOP published successfully!");
    navigate(`/sops/${id}`);
  };

  return (
    <AppLayout
      title="Edit SOP"
      description={`Editing: ${title || "Untitled SOP"}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/sops/${id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button onClick={handlePublish}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Button variant="ghost" asChild className="pl-0">
          <Link to="/sops">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to SOPs
          </Link>
        </Button>

        {/* SOP Details */}
        <Card>
          <CardHeader>
            <CardTitle>SOP Details</CardTitle>
            <CardDescription>
              Edit the basic information for your procedure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sop-title">Title</Label>
              <Input
                id="sop-title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
                placeholder="e.g., Customer Onboarding Process"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sop-description">Description</Label>
              <Textarea
                id="sop-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                placeholder="Briefly describe what this SOP covers..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Steps</CardTitle>
                <CardDescription>
                  Edit the steps for your procedure
                </CardDescription>
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
                <p className="text-sm text-muted-foreground mb-4">
                  No steps in this SOP. Click "Add Step" to get started.
                </p>
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
                      step.hasWarning && "border-warning bg-warning/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                          {step.orderNumber}
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(step.id, { title: e.target.value })}
                          placeholder="Step title..."
                          className="font-medium"
                        />
                        
                        <Textarea
                          value={step.description}
                          onChange={(e) => updateStep(step.id, { description: e.target.value })}
                          placeholder="Describe what to do in this step..."
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
                      </div>
                      
                      <div className="flex flex-col gap-1">
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
