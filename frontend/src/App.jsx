import { ToastProvider } from "./contexts/ToastContext";
import PageLayout from "./layouts/PageLayout";
import Hero from "./components/Hero";
import BuyPage from "./pages/BuyPage";
import PoolsPage from "./pages/PoolsPage";
import ClaimPage from "./pages/ClaimPage";
import TokenomicsPage from "./pages/TokenomicsPage";
import RulesPage from "./pages/RulesPage";

/**
 * Agent Vein frontend — live on BSC mainnet (chain 56).
 * Sale state, epoch, claims and referrals come from services/preview.js
 * (real on-chain reads); action buttons send transactions through the
 * user's own connected wallet.
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
