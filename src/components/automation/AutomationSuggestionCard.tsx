import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Lightbulb, Zap, Workflow, Code, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationSuggestion {
  id: string;
  title: string;
  description: string;
  automation_type: string;
  integration_tools: string[] | null;
  estimated_time_saved: string | null;
  implementation_difficulty: string | null;
  status: string;
}

interface AutomationSuggestionCardProps {
  suggestion: AutomationSuggestion;
  onStatusChange: (id: string, status: string) => void;
}

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  zapier: { label: "Zapier", icon: Zap, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  n8n: { label: "n8n", icon: Workflow, color: "bg-red-500/10 text-red-500 border-red-500/20" },
  make: { label: "Make", icon: Workflow, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  api: { label: "API", icon: Globe, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  script: { label: "Script", icon: Code, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  other: { label: "Other", icon: Lightbulb, color: "bg-muted text-muted-foreground" },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "bg-success/10 text-success border-success/20" },
  medium: { label: "Medium", color: "bg-warning/10 text-warning border-warning/20" },
  hard: { label: "Hard", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function AutomationSuggestionCard({ suggestion, onStatusChange }: AutomationSuggestionCardProps) {
  const typeInfo = typeConfig[suggestion.automation_type] || typeConfig.other;
  const difficultyInfo = difficultyConfig[suggestion.implementation_difficulty || "medium"] || difficultyConfig.medium;
  const TypeIcon = typeInfo.icon;

  if (suggestion.status === "dismissed") {
    return null;
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      suggestion.status === "implemented" && "border-success/50 bg-success/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", typeInfo.color)}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{suggestion.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", typeInfo.color)}>
                  {typeInfo.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", difficultyInfo.color)}>
                  {difficultyInfo.label}
                </Badge>
              </div>
            </div>
          </div>
          {suggestion.status === "implemented" && (
            <Badge className="bg-success text-success-foreground">
              <Check className="mr-1 h-3 w-3" />
              Implemented
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm leading-relaxed">
          {suggestion.description}
        </CardDescription>

        {suggestion.integration_tools && suggestion.integration_tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.integration_tools.map((tool) => (
              <Badge key={tool} variant="secondary" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        )}

        {suggestion.estimated_time_saved && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Saves ~{suggestion.estimated_time_saved}</span>
          </div>
        )}

        {suggestion.status !== "implemented" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onStatusChange(suggestion.id, "implemented")}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Mark Implemented
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(suggestion.id, "dismissed")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
