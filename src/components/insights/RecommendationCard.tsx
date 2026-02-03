import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, Zap, Layers, AlertTriangle, TrendingUp } from "lucide-react";

export interface Recommendation {
  id: string;
  recommendation_type: "automation" | "consolidation" | "warning" | "efficiency";
  title: string;
  description: string;
  status: "pending" | "applied" | "dismissed";
  affected_processes: string[];
  created_at: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const typeConfig = {
  automation: {
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    badgeVariant: "default" as const,
    label: "Automation",
  },
  consolidation: {
    icon: Layers,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    badgeVariant: "secondary" as const,
    label: "Consolidation",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    badgeVariant: "destructive" as const,
    label: "Warning",
  },
  efficiency: {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    badgeVariant: "outline" as const,
    label: "Efficiency",
  },
};

export function RecommendationCard({
  recommendation,
  onApply,
  onDismiss,
}: RecommendationCardProps) {
  const config = typeConfig[recommendation.recommendation_type];
  const Icon = config.icon;
  const isPending = recommendation.status === "pending";

  return (
    <Card
      className={cn(
        "transition-all",
        !isPending && "opacity-60"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {recommendation.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.label}
                </Badge>
                {!isPending && (
                  <Badge
                    variant={recommendation.status === "applied" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {recommendation.status === "applied" ? "Applied" : "Dismissed"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">
          {recommendation.description}
        </CardDescription>

        {recommendation.affected_processes.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Affects {recommendation.affected_processes.length} process
            {recommendation.affected_processes.length > 1 ? "es" : ""}
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onApply?.(recommendation.id)}
            >
              <Check className="h-3.5 w-3.5" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={() => onDismiss?.(recommendation.id)}
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
