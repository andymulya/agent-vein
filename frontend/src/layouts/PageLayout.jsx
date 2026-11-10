import PreviewStrip from "./PreviewStrip";
import Header from "./Header";
import Footer from "./Footer";
import Toast from "../components/Toast";

/**
 * Page chrome: preview strip, sticky header, content, footer, toast.
 * Page sections themselves live in src/pages/.
 */
export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg0 text-ink">
      <div className="vignette" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <PreviewStrip />
      <Header />
      <main>{children}</main>
      <Footer />
      <Toast />
    </div>
  );
}
