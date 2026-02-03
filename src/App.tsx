import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AIAssistant } from "@/components/ai/AIAssistant";
import Dashboard from "./pages/Dashboard";
import Recordings from "./pages/Recordings";
import RecordingNew from "./pages/RecordingNew";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/recordings" element={<Recordings />} />
            <Route path="/recordings/new" element={<RecordingNew />} />
            <Route path="/sops" element={<SOPs />} />
            <Route path="/sops/new" element={<SOPNew />} />
            <Route path="/sops/:id" element={<SOPView />} />
            <Route path="/sops/:id/edit" element={<SOPEdit />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/automations" element={<Automations />} />
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
