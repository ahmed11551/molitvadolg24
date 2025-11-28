import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Goals from "./pages/Goals";
import Dhikr from "./pages/Dhikr";
import Tasbih from "./pages/Tasbih";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { initTelegramWebApp } from "./lib/telegram";
import { ConsentDialog } from "./components/qaza/ConsentDialog";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Инициализация Telegram WebApp при загрузке
    initTelegramWebApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConsentDialog />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/dhikr" element={<Dhikr />} />
              <Route path="/tasbih" element={<Tasbih />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
