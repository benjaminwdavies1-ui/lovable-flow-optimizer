import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Map,
  Brain,
  Zap,
  LogOut,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainNavItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "SOPs", url: "/app/sops", icon: FileText },
  { title: "Knowledge Base", url: "/app/knowledge", icon: BookOpen },
];

const insightsNavItems = [
  { title: "Overview", url: "/app/insights", icon: BarChart3, exact: true },
  { title: "Process Maps", url: "/app/insights/process-maps", icon: Map },
  { title: "Business Knowledge", url: "/app/insights/knowledge", icon: Brain },
  { title: "Automations", url: "/app/insights/automations", icon: Zap },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";
  const displayName = user?.user_metadata?.full_name || user?.email || "User";

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return location.pathname === url;
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const navItemClass = (active: boolean) =>
    cn(
      "w-full justify-start gap-3 h-9 rounded-none px-3 text-sm font-medium transition-colors border-l-2",
      active
        ? "border-l-primary bg-sidebar-accent text-sidebar-accent-foreground"
        : "border-l-transparent text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    );

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-4 py-4">
        <Link to="/app" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="text-base font-semibold text-sidebar-foreground tracking-tight">Opstrace</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-2xs font-medium uppercase tracking-widest text-sidebar-muted">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={navItemClass(location.pathname === item.url)}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-2xs font-medium uppercase tracking-widest text-sidebar-muted">Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    className={navItemClass(isActive(item.url, item.exact))}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-0 pb-3">
        <SidebarSeparator className="mb-2 bg-sidebar-border" />
        <div className="mb-1 flex items-center gap-3 px-4 py-1.5">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-2xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/app/settings"}
              className={navItemClass(location.pathname === "/app/settings")}
            >
              <Link to="/app/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="w-full justify-start gap-3 h-9 rounded-none px-3 text-sm font-medium text-sidebar-foreground transition-colors border-l-2 border-l-transparent hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
