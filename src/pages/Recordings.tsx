import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Video, MoreHorizontal, Play, FileText, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

// Placeholder data
const mockRecordings = [
  {
    id: "1",
    title: "Create New Customer Order",
    status: "completed" as const,
    stepCount: 12,
    duration: "4:32",
    createdAt: "2024-01-15T10:30:00",
  },
  {
    id: "2",
    title: "Process Refund Request",
    status: "converted" as const,
    stepCount: 8,
    duration: "2:15",
    createdAt: "2024-01-14T14:20:00",
  },
  {
    id: "3",
    title: "Update Inventory Levels",
    status: "in_progress" as const,
    stepCount: 5,
    duration: "1:45",
    createdAt: "2024-01-14T09:00:00",
  },
  {
    id: "4",
    title: "Onboard New Team Member",
    status: "completed" as const,
    stepCount: 18,
    duration: "8:12",
    createdAt: "2024-01-13T11:45:00",
  },
  {
    id: "5",
    title: "Generate Monthly Report",
    status: "converted" as const,
    stepCount: 15,
    duration: "6:30",
    createdAt: "2024-01-12T16:00:00",
  },
];

const statusConfig = {
  in_progress: {
    label: "In Progress",
    className: "bg-info text-info-foreground",
  },
  completed: {
    label: "Completed",
    className: "bg-success text-success-foreground",
  },
  converted: {
    label: "Converted",
    className: "border-primary text-primary bg-primary/10",
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Recordings() {
  return (
    <AppLayout
      title="Recordings"
      description="All your captured workflow sessions"
      actions={
        <Button asChild>
          <Link to="/recordings/new">
            <Video className="mr-2 h-4 w-4" />
            New Recording
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecordings.map((recording) => {
                const status = statusConfig[recording.status];
                return (
                  <TableRow key={recording.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Video className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{recording.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(status.className)} variant="secondary">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{recording.stepCount}</TableCell>
                    <TableCell>{recording.duration}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(recording.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/recordings/${recording.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {recording.status === "completed" && (
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Convert to SOP
                            </DropdownMenuItem>
                          )}
                          {recording.status === "in_progress" && (
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
