import { useEffect, useState } from "react";

const SECTION_IDS = ["beli", "pool", "klaim", "tokenomik", "aturan"];

/** Highlights the nav tab of the section currently in view. */
export function useActiveSection() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const seen = {};
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          seen[en.target.id] = en.isIntersecting;
        });
        let current = null;
        SECTION_IDS.forEach((id) => {
          if (seen[id]) current = current || id;
        });
        setActive(current);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return active;
}
