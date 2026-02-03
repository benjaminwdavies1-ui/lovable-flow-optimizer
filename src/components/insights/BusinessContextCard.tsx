import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, GitBranch, BookOpen, Sparkles } from "lucide-react";

export interface BusinessContext {
  id: string;
  context_type: "process_pattern" | "business_rule" | "optimization_insight";
  title: string;
  content: string;
  confidence_score: number;
  source_ids: string[];
  created_at: string;
}

interface BusinessContextCardProps {
  context: BusinessContext;
  className?: string;
}

const typeConfig = {
  process_pattern: {
    icon: GitBranch,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    label: "Pattern",
  },
  business_rule: {
    icon: BookOpen,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    label: "Rule",
  },
  optimization_insight: {
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    label: "Insight",
  },
};

export function BusinessContextCard({ context, className }: BusinessContextCardProps) {
  const config = typeConfig[context.context_type];
  const Icon = config.icon;
  const confidencePercent = Math.round(context.confidence_score * 100);

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {confidencePercent}% confidence
              </span>
            </div>
            <CardTitle className="text-sm font-medium leading-tight">
              {context.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed">
          {context.content}
        </CardDescription>
        {context.source_ids.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Based on {context.source_ids.length} source
            {context.source_ids.length > 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
