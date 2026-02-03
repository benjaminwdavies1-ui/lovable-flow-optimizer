import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SOP {
  id: string;
  title: string;
  status: "draft" | "published";
  stepCount: number;
  updatedAt: string;
}

interface RecentSOPsProps {
  sops: SOP[];
}

const statusConfig = {
  draft: {
    label: "Draft",
    variant: "secondary" as const,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  published: {
    label: "Published",
    variant: "default" as const,
    className: "bg-success text-success-foreground",
  },
};

export function RecentSOPs({ sops }: RecentSOPsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Recent SOPs</CardTitle>
          <CardDescription>Your standard operating procedures</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/sops" className="gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {sops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No SOPs created yet</p>
            <p className="text-xs text-muted-foreground">Convert a recording or create a new SOP</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sops.map((sop) => {
              const status = statusConfig[sop.status];
              return (
                <Link
                  key={sop.id}
                  to={`/sops/${sop.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sop.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{sop.stepCount} steps</span>
                        <span>•</span>
                        <span>Updated {sop.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={cn(status.className)} variant={status.variant}>
                    {status.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
