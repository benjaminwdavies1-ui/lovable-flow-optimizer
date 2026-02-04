import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { 
  FileText, 
  Plus, 
  Trash2, 
  GripVertical, 
  AlertTriangle,
  Save,
  Eye,
  Send,
  ArrowLeft,
  Users,
  Building2,
  Wrench
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSOPWithSteps, updateSOP, type SOP, type SOPStep as DBSOPStep } from "@/services/sopService";

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

export default function SOPEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SOPStep[]>([]);
  const [employeeTags, setEmployeeTags] = useState<string[]>([]);
  const [departmentTags, setDepartmentTags] = useState<string[]>([]);
  const [toolsTags, setToolsTags] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load SOP data from database
  useEffect(() => {
    async function loadSOP() {
      if (!id) return;
      setIsLoading(true);
      const data = await getSOPWithSteps(id);
      if (data) {
        setTitle(data.sop.title);
        setDescription(data.sop.description || "");
        setEmployeeTags(data.sop.employee_tags || []);
        setDepartmentTags(data.sop.department_tags || []);
        setToolsTags(data.sop.tools_tags || []);
        setSteps(data.steps.map(step => ({
          id: step.id,
          orderNumber: step.order_number,
          title: step.title || "",
          description: step.description || "",
          screenshotUrl: step.screenshot_url || undefined,
          showScreenshot: step.show_screenshot || false,
          hasWarning: step.has_warning || false,
          warningText: step.warning_text || undefined,
          isRedacted: step.is_redacted || false,
        })));
      }
      setIsLoading(false);
    }
    loadSOP();
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
    
    if (!id) return;
    
    await updateSOP(id, {
      title,
      description,
      employee_tags: employeeTags,
      department_tags: departmentTags,
      tools_tags: toolsTags,
    });
    
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
    
    if (!id) return;
    
    await updateSOP(id, {
      title,
      description,
      employee_tags: employeeTags,
      department_tags: departmentTags,
      tools_tags: toolsTags,
      status: "published",
      published_at: new Date().toISOString(),
    });
    
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
            
            {/* Tags Section */}
            <div className="grid gap-4 pt-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Employee Tags
                </Label>
                <TagInput
                  value={employeeTags}
                  onChange={(tags) => { setEmployeeTags(tags); setIsDirty(true); }}
                  placeholder="Add employee names..."
                  variant="employee"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  Department Tags
                </Label>
                <TagInput
                  value={departmentTags}
                  onChange={(tags) => { setDepartmentTags(tags); setIsDirty(true); }}
                  placeholder="Add department names..."
                  variant="department"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-green-500" />
                  Tools & Software Tags
                </Label>
                <TagInput
                  value={toolsTags}
                  onChange={(tags) => { setToolsTags(tags); setIsDirty(true); }}
                  placeholder="Add tools or software..."
                  variant="tools"
                />
              </div>
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
