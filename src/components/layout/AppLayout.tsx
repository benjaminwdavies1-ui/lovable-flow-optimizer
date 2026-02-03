import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, description, actions }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              {title && (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
