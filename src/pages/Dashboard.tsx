import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRecordings } from "@/components/dashboard/RecentRecordings";
import { RecentSOPs } from "@/components/dashboard/RecentSOPs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, FileText, Clock, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDashboardStats,
  getRecentRecordings,
  getRecentSOPs,
  type DashboardStats,
} from "@/services/sopService";
import type { Tables } from "@/integrations/supabase/types";

type Recording = Tables<"recordings">;

interface SOPWithCount {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  step_count: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}.${Math.floor(mins / 6)}h`;
  }
  return `${mins}m`;
}

function formatRecordingDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [recentSOPs, setRecentSOPs] = useState<SOPWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      setIsLoading(true);

      const [statsData, recordingsData, sopsData] = await Promise.all([
        getDashboardStats(),
        getRecentRecordings(3),
        getRecentSOPs(2),
      ]);

      setStats(statsData);
      setRecentRecordings(recordingsData);
      setRecentSOPs(sopsData);
      setIsLoading(false);
    }
    loadDashboard();
  }, [user]);

  // Transform recordings for the component
  const formattedRecordings = recentRecordings.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as "in_progress" | "completed" | "converted",
    stepCount: r.step_count || 0,
    duration: formatRecordingDuration(r.duration_seconds),
    createdAt: formatRelativeTime(r.created_at),
  }));

  // Transform SOPs for the component
  const formattedSOPs = recentSOPs.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status as "draft" | "published",
    stepCount: s.step_count,
    updatedAt: formatRelativeTime(s.updated_at),
  }));

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
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Recordings"
              value={stats?.totalRecordings || 0}
              description="All time"
              icon={Video}
            />
            <StatCard
              title="SOPs Created"
              value={stats?.totalSOPs || 0}
              description="All time"
              icon={FileText}
            />
            <StatCard
              title="Time Documented"
              value={formatDuration(stats?.totalDurationSeconds || 0)}
              description="Total recorded"
              icon={Clock}
            />
            <StatCard
              title="Avg. Steps per SOP"
              value={stats?.avgStepsPerSOP || 0}
              description="Across all procedures"
              icon={FileText}
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <RecentRecordings recordings={formattedRecordings} />
            <RecentSOPs sops={formattedSOPs} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
