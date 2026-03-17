import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConstructionsProvider } from "@/contexts/ConstructionsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ObrasList from "./pages/ObrasList";
import ObraDetail from "./pages/ObraDetail";
import NovaObra from "./pages/NovaObra";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ConstructionsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/obras" element={<ProtectedRoute><ObrasList /></ProtectedRoute>} />
              <Route path="/obras/nova" element={<ProtectedRoute><NovaObra /></ProtectedRoute>} />
              <Route path="/obras/:id" element={<ProtectedRoute><ObraDetail /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ConstructionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
