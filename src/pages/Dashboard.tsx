import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentSOPs } from "@/components/dashboard/RecentSOPs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDashboardStats,
  getRecentSOPs,
  type DashboardStats,
} from "@/services/sopService";

interface SOPWithCount {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  step_count: number;
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
  const [recentSOPs, setRecentSOPs] = useState<SOPWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      setIsLoading(true);

      const [statsData, sopsData] = await Promise.all([
        getDashboardStats(),
        getRecentSOPs(4),
      ]);

      setStats(statsData);
      setRecentSOPs(sopsData);
      setIsLoading(false);
    }
    loadDashboard();
  }, [user]);

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
      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            {[1, 2].map((i) => (
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
              title="SOPs Created"
              value={stats?.totalSOPs || 0}
              description="All time"
              icon={FileText}
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

      {/* Recent SOPs */}
      {isLoading ? (
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
      ) : (
        <RecentSOPs sops={formattedSOPs} />
      )}
    </AppLayout>
  );
}
