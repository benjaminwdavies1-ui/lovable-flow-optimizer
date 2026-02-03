import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  FileText,
  Settings,
  BarChart3,
  Zap,
  LogOut,
  User,
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
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Recordings",
    url: "/recordings",
    icon: Video,
  },
  {
    title: "SOPs",
    url: "/sops",
    icon: FileText,
  },
];

const futureNavItems = [
  {
    title: "Insights",
    url: "/insights",
    icon: BarChart3,
    disabled: false,
  },
  {
    title: "Automations",
    url: "/automations",
    icon: Zap,
    disabled: false,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const displayName = user?.user_metadata?.full_name || user?.email || "User";

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-4 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            Opstrace
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      location.pathname === item.url
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
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

        <SidebarSeparator className="my-4 bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
            Coming Soon
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {futureNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.disabled ? (
                    <SidebarMenuButton
                      disabled
                      className={cn(
                        "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        "cursor-not-allowed opacity-50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      className={cn(
                        "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        location.pathname === item.url
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarSeparator className="mb-4 bg-sidebar-border" />
        
        {/* User Profile */}
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </p>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/settings"}
              className={cn(
                "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location.pathname === "/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
