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
import { FileText, MoreHorizontal, Edit, Eye, Share2, Download, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Placeholder data
const mockSOPs = [
  {
    id: "1",
    title: "Customer Order Processing",
    description: "Complete guide to processing customer orders in the CRM",
    status: "published" as const,
    version: 2,
    stepCount: 12,
    updatedAt: "2024-01-15T10:30:00",
  },
  {
    id: "2",
    title: "Refund Request Handling",
    description: "Standard procedure for handling customer refund requests",
    status: "draft" as const,
    version: 1,
    stepCount: 8,
    updatedAt: "2024-01-14T14:20:00",
  },
  {
    id: "3",
    title: "New Employee Onboarding",
    description: "Step-by-step onboarding process for new team members",
    status: "published" as const,
    version: 3,
    stepCount: 18,
    updatedAt: "2024-01-13T11:45:00",
  },
  {
    id: "4",
    title: "Monthly Report Generation",
    description: "How to generate and distribute monthly performance reports",
    status: "published" as const,
    version: 1,
    stepCount: 15,
    updatedAt: "2024-01-12T16:00:00",
  },
];

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  published: {
    label: "Published",
    className: "bg-success text-success-foreground",
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SOPs() {
  return (
    <AppLayout
      title="SOPs"
      description="Your standard operating procedures library"
      actions={
        <Button asChild>
          <Link to="/sops/new">
            <Plus className="mr-2 h-4 w-4" />
            Create SOP
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
                <TableHead>Version</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSOPs.map((sop) => {
                const status = statusConfig[sop.status];
                return (
                  <TableRow key={sop.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-medium">{sop.title}</span>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {sop.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(status.className)} variant="secondary">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>v{sop.version}</TableCell>
                    <TableCell>{sop.stepCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(sop.updatedAt)}
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
                            <Link to={`/sops/${sop.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/sops/${sop.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                          </DropdownMenuItem>
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
