import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UIProvider } from "./store/uiStore";
import Dashboard from "./pages/Dashboard";
import Advanced from "./pages/Advanced";
import LiveView from "./pages/LiveView";
import NotFound from "./pages/NotFound";
import { SecurityGuard } from "./components/SecurityGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UIProvider>
      {/* 🛡️ Ativando a Proteção de Segurança Global */}
      <SecurityGuard />
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/advanced" element={<Advanced />} />
            <Route path="/live" element={<LiveView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UIProvider>
  </QueryClientProvider>
);

export default App;
