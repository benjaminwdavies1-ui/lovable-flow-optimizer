import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRecordings } from "@/components/dashboard/RecentRecordings";
import { RecentSOPs } from "@/components/dashboard/RecentSOPs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, FileText, Clock, Play } from "lucide-react";

// Placeholder data - will be replaced with real data from Supabase
const mockRecordings = [
  {
    id: "1",
    title: "Create New Customer Order",
    status: "completed" as const,
    stepCount: 12,
    duration: "4:32",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Process Refund Request",
    status: "converted" as const,
    stepCount: 8,
    duration: "2:15",
    createdAt: "Yesterday",
  },
  {
    id: "3",
    title: "Update Inventory Levels",
    status: "in_progress" as const,
    stepCount: 5,
    duration: "1:45",
    createdAt: "Yesterday",
  },
];

const mockSOPs = [
  {
    id: "1",
    title: "Customer Order Processing",
    status: "published" as const,
    stepCount: 12,
    updatedAt: "2 days ago",
  },
  {
    id: "2",
    title: "Refund Request Handling",
    status: "draft" as const,
    stepCount: 8,
    updatedAt: "3 days ago",
  },
];

export default function Dashboard() {
  return (
    <AppLayout
      title="Dashboard"
      description="Welcome back. Here's an overview of your operations."
    >
      {/* Start Recording CTA */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Start Recording</h2>
              <p className="text-sm text-muted-foreground">
                Capture your workflow and automatically generate documentation
              </p>
            </div>
          </div>
          <Button size="lg" asChild>
            <Link to="/recordings/new">
              <Video className="mr-2 h-4 w-4" />
              Start Recording
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Recordings"
          value={24}
          description="All time"
          icon={Video}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="SOPs Created"
          value={18}
          description="All time"
          icon={FileText}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Time Documented"
          value="12.5h"
          description="This month"
          icon={Clock}
        />
        <StatCard
          title="Avg. Steps per SOP"
          value={9}
          description="Across all procedures"
          icon={FileText}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentRecordings recordings={mockRecordings} />
        <RecentSOPs sops={mockSOPs} />
      </div>
    </AppLayout>
  );
}
