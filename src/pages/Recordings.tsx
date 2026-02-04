import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Video, MoreHorizontal, Play, FileText, Trash2, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserRecordingsWithCounts,
  deleteRecording,
  type RecordingWithStepCount,
} from "@/services/recordingService";
import { createSOPFromRecording } from "@/services/sopService";

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

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Recordings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<RecordingWithStepCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecordings() {
      if (!user) return;
      setIsLoading(true);
      const data = await getUserRecordingsWithCounts();
      setRecordings(data);
      setIsLoading(false);
    }
    loadRecordings();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const success = await deleteRecording(deleteId);
    if (success) {
      setRecordings((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Recording deleted");
    } else {
      toast.error("Failed to delete recording");
    }
    setIsDeleting(false);
    setDeleteId(null);
  };

  const handleConvertToSOP = async (recordingId: string) => {
    if (!user) return;
    setConvertingId(recordingId);
    const sop = await createSOPFromRecording(recordingId, user.id);
    if (sop) {
      toast.success("SOP created successfully!");
      navigate(`/sops/${sop.id}`);
    } else {
      toast.error("Failed to convert to SOP");
    }
    setConvertingId(null);
  };

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
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No recordings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start your first recording to capture a workflow
              </p>
              <Button asChild>
                <Link to="/recordings/new">
                  <Video className="mr-2 h-4 w-4" />
                  New Recording
                </Link>
              </Button>
            </div>
          ) : (
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
                {recordings.map((recording) => {
                  const statusKey = recording.status as keyof typeof statusConfig;
                  const status = statusConfig[statusKey] || statusConfig.completed;
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
                      <TableCell>{recording.step_count}</TableCell>
                      <TableCell>{formatDuration(recording.duration_seconds)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(recording.created_at)}
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
                              <DropdownMenuItem 
                                onClick={() => handleConvertToSOP(recording.id)}
                                disabled={convertingId === recording.id}
                              >
                                {convertingId === recording.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="mr-2 h-4 w-4" />
                                )}
                                Convert to SOP
                              </DropdownMenuItem>
                            )}
                            {recording.status === "in_progress" && (
                              <DropdownMenuItem asChild>
                                <Link to={`/recordings/${recording.id}`}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Resume
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(recording.id)}
                            >
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              recording and all its steps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
