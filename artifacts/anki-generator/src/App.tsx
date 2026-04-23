import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { SplashScreen } from "@/components/splash-screen";
import { PageTransition } from "@/components/page-transition";

import Dashboard from "@/pages/dashboard";
import Generate from "@/pages/generate";
import Decks from "@/pages/decks";
import DeckDetail from "@/pages/deck-detail";
import History from "@/pages/history";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <PageTransition>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/generate" component={Generate} />
          <Route path="/decks" component={Decks} />
          <Route path="/decks/:id" component={DeckDetail} />
          <Route path="/history" component={History} />
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SplashScreen>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </SplashScreen>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
