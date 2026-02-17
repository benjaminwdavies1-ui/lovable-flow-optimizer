import { Link, useLocation, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { BarChart3, Map, Brain, Zap } from "lucide-react";

const tabs = [
  { label: "Overview", path: "/insights", icon: BarChart3, exact: true },
  { label: "Process Maps", path: "/insights/process-maps", icon: Map },
  { label: "Business Knowledge", path: "/insights/knowledge", icon: Brain },
  { label: "Automations", path: "/insights/automations", icon: Zap },
];

export default function InsightsLayout() {
  const location = useLocation();

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exact) return location.pathname === tab.path;
    return location.pathname.startsWith(tab.path);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground mt-1">AI-powered analysis of your business processes</p>
        </div>

        <div className="border-b border-border">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  isActive(tab)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <Outlet />
      </div>
    </AppLayout>
  );
}
