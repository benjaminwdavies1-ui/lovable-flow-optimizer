import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AIAssistant } from "@/components/ai/AIAssistant";
import Dashboard from "./pages/Dashboard";
import SOPs from "./pages/SOPs";
import SOPNew from "./pages/SOPNew";
import SOPView from "./pages/SOPView";
import SOPEdit from "./pages/SOPEdit";
import Settings from "./pages/Settings";
import Insights from "./pages/Insights";
import Automations from "./pages/Automations";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/sops" element={<AuthGuard><SOPs /></AuthGuard>} />
            <Route path="/sops/new" element={<AuthGuard><SOPNew /></AuthGuard>} />
            <Route path="/sops/:id" element={<AuthGuard><SOPView /></AuthGuard>} />
            <Route path="/sops/:id/edit" element={<AuthGuard><SOPEdit /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/insights" element={<AuthGuard><Insights /></AuthGuard>} />
            <Route path="/automations" element={<AuthGuard><Automations /></AuthGuard>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistant />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
