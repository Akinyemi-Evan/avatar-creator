import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Capture from "./pages/Capture";
import TryOn from "./pages/TryOn";
import MyAvatars from "./pages/MyAvatars";
import MyWardrobe from "./pages/MyWardrobe";
import Favorites from "./pages/Favorites";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/capture"
            element={
              <ProtectedRoute>
                <Capture />
              </ProtectedRoute>
            }
          />
          <Route
            path="/try-on"
            element={
              <ProtectedRoute>
                <TryOn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-avatars"
            element={
              <ProtectedRoute>
                <MyAvatars />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-wardrobe"
            element={
              <ProtectedRoute>
                <MyWardrobe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
