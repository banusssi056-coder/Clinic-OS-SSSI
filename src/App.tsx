import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AIInsights from "@/pages/AIInsights";
import Appointments from "@/pages/Appointments";
import Patients from "@/pages/Patients";
import Billing from "@/pages/Billing";
import Messages from "@/pages/Messages";
import Campaigns from "@/pages/Campaigns";
import Reviews from "@/pages/Reviews";
import Staff from "@/pages/Staff";
import Automations from "@/pages/Automations";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import ClinicalWorkspace from "@/pages/ClinicalWorkspace";
import PatientWellness from "@/pages/PatientWellness";
import NotFound from "./pages/NotFound";
import AIConsultationSupport from "./pages/AIConsultationSupport";
import SOAPNotes from "./pages/SOAPNotes";
import PredictiveDiagnosis from "./pages/PredictiveDiagnosis";
import FamilyDashboard from "./pages/FamilyDashboard";
import LabInterpreter from "./pages/LabInterpreter";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

const Shell = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth><AppShell>{children}</AppShell></RequireAuth>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Shell><Dashboard /></Shell>} />
            <Route path="/ai" element={<Shell><AIInsights /></Shell>} />
            <Route path="/appointments" element={<Shell><Appointments /></Shell>} />
            <Route path="/patients" element={<Shell><Patients /></Shell>} />
            <Route path="/family-dashboard" element={<Shell><FamilyDashboard /></Shell>} />
            <Route path="/billing" element={<Shell><Billing /></Shell>} />
            <Route path="/messages" element={<Shell><Messages /></Shell>} />
            <Route path="/campaigns" element={<Shell><Campaigns /></Shell>} />
            <Route path="/reviews" element={<Shell><Reviews /></Shell>} />
            <Route path="/staff" element={<Shell><Staff /></Shell>} />
            <Route path="/automations" element={<Shell><Automations /></Shell>} />
            <Route path="/reports" element={<Shell><Reports /></Shell>} />
            <Route path="/admin" element={<Shell><Admin /></Shell>} />
            <Route path="/clinical" element={<Shell><ClinicalWorkspace /></Shell>} />
            <Route path="/wellness" element={<Shell><PatientWellness /></Shell>} />
            <Route path="/consultation" element={<Shell><AIConsultationSupport /></Shell>} />
            <Route path="/clinical-notes" element={<Shell><SOAPNotes /></Shell>} />
            <Route path="/diagnosis" element={<Shell><PredictiveDiagnosis /></Shell>} />
            <Route path="/lab-interpreter" element={<Shell><LabInterpreter /></Shell>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
