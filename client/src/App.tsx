import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect, ComponentType } from "react";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ReelDetailPage from "@/pages/reel-detail";
import GsmReelsPage from "@/pages/gsm-reels";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";


// Wrapper to protect routes
function ProtectedRoute({
  component: Component,
}: {
  component: ComponentType;
}) {
  const { data: user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  // Use effect to handle navigation instead of calling during render
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />


      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      {/* <Route path="/reels">
        <ProtectedRoute component={Dashboard} />
      </Route> */}
      <Route path="/reels/:id">
        <ProtectedRoute component={ReelDetailPage} />
      </Route>

      <Route path="/reels/gsm/:gsm" component={GsmReelsPage} />


      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
