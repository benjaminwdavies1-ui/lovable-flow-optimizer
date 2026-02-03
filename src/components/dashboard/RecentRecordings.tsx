import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recording {
  id: string;
  title: string;
  status: "in_progress" | "completed" | "converted";
  stepCount: number;
  duration: string;
  createdAt: string;
}

interface RecentRecordingsProps {
  recordings: Recording[];
}

const statusConfig = {
  in_progress: {
    label: "In Progress",
    variant: "default" as const,
    className: "bg-info text-info-foreground",
  },
  completed: {
    label: "Completed",
    variant: "secondary" as const,
    className: "bg-success text-success-foreground",
  },
  converted: {
    label: "Converted",
    variant: "outline" as const,
    className: "border-primary text-primary",
  },
};

export function RecentRecordings({ recordings }: RecentRecordingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Recordings</CardTitle>
          <CardDescription>Your latest workflow captures</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/recordings" className="gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Video className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No recordings yet</p>
            <p className="text-xs text-muted-foreground">Start a recording to capture your workflow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => {
              const status = statusConfig[recording.status];
              return (
                <Link
                  key={recording.id}
                  to={`/recordings/${recording.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{recording.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{recording.stepCount} steps</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recording.duration}
                        </span>
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
