import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AIAssistant } from "@/components/ai/AIAssistant";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import SOPs from "./pages/SOPs";
import SOPNew from "./pages/SOPNew";
import SOPView from "./pages/SOPView";
import SOPEdit from "./pages/SOPEdit";
import Settings from "./pages/Settings";
import InsightsLayout from "./pages/insights/InsightsLayout";
import InsightsOverview from "./pages/insights/InsightsOverview";
import ProcessMaps from "./pages/insights/ProcessMaps";
import BusinessKnowledge from "./pages/insights/BusinessKnowledge";
import AutomationRecommendations from "./pages/insights/AutomationRecommendations";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import KnowledgeBase from "./pages/KnowledgeBase";
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
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />

            {/* Authenticated app routes */}
            <Route path="/app" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/app/sops" element={<AuthGuard><SOPs /></AuthGuard>} />
            <Route path="/app/sops/new" element={<AuthGuard><SOPNew /></AuthGuard>} />
            <Route path="/app/sops/:id" element={<AuthGuard><SOPView /></AuthGuard>} />
            <Route path="/app/sops/:id/edit" element={<AuthGuard><SOPEdit /></AuthGuard>} />
            <Route path="/app/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/app/knowledge" element={<AuthGuard><KnowledgeBase /></AuthGuard>} />

            <Route path="/app/insights" element={<AuthGuard><InsightsLayout /></AuthGuard>}>
              <Route index element={<InsightsOverview />} />
              <Route path="process-maps" element={<ProcessMaps />} />
              <Route path="knowledge" element={<BusinessKnowledge />} />
              <Route path="automations" element={<AutomationRecommendations />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/sops" element={<Navigate to="/app/sops" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
            <Route path="/insights/*" element={<Navigate to="/app/insights" replace />} />
            <Route path="/automations" element={<Navigate to="/app/insights/automations" replace />} />
            <Route path="/knowledge" element={<Navigate to="/app/knowledge" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistant />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
