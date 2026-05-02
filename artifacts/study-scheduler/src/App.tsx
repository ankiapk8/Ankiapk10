import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";
import { Home } from "@/pages/Home";
import { SubMedicine } from "@/pages/SubMedicine";
import { SubSurgery } from "@/pages/SubSurgery";
import { GynecologyHub } from "@/pages/GynecologyHub";
import { TopicPage } from "@/pages/TopicPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppRoutes() {
  const auth = useAuth();

  return (
    <AuthGate auth={auth}>
      <Switch>
        <Route path="/" component={() => <Home user={auth.user!} onLogout={auth.logout} />} />

        <Route path="/sub-medicine" component={SubMedicine} />
        <Route path="/sub-medicine/:key" component={({ params }) => (
          <TopicPage storageKey={params.key} backPath="/sub-medicine" />
        )} />

        <Route path="/psychiatric" component={() => (
          <TopicPage storageKey="psychiatric" backPath="/" />
        )} />

        <Route path="/sub-surgery" component={SubSurgery} />
        <Route path="/sub-surgery/:key" component={({ params }) => (
          <TopicPage storageKey={params.key} backPath="/sub-surgery" />
        )} />

        <Route path="/pediatric" component={() => (
          <TopicPage storageKey="pediatric" backPath="/" />
        )} />

        <Route path="/gynecology" component={GynecologyHub} />
        <Route path="/gynecology/:key" component={({ params }) => (
          <TopicPage storageKey={params.key} backPath="/gynecology" />
        )} />

        <Route component={() => (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Page not found</p>
              <a href="/" className="text-sm text-primary hover:underline mt-2 block">Back to home</a>
            </div>
          </div>
        )} />
      </Switch>
    </AuthGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
