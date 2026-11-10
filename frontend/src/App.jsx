import { ToastProvider } from "./contexts/ToastContext";
import PageLayout from "./layouts/PageLayout";
import Hero from "./components/Hero";
import BuyPage from "./pages/BuyPage";
import PoolsPage from "./pages/PoolsPage";
import ClaimPage from "./pages/ClaimPage";
import TokenomicsPage from "./pages/TokenomicsPage";
import RulesPage from "./pages/RulesPage";

/**
 * Agent Vein frontend — preview mode.
 * The contract is not deployed yet, so all data comes from
 * services/preview.js and every action button shows a preview toast.
 * Real contract integration plugs in later (see README.md).
 */
export default function App() {
  return (
    <ToastProvider>
      <PageLayout>
        <Hero />
        <BuyPage />
        <PoolsPage />
        <ClaimPage />
        <TokenomicsPage />
        <RulesPage />
      </PageLayout>
    </ToastProvider>
  );
}
