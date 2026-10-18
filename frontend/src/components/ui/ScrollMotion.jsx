import { useEffect } from "react";

const REVEAL_SELECTOR = [
  ".section-heading",
  ".info-card",
  ".document-card",
  ".contact-card",
  ".role-card",
  ".hero-service-card",
  ".resident-service-card",
  ".resident-action-card",
  ".staff-service-card",
  ".dashboard-stat-card",
  ".staff-stat-card",
  ".admin-overview-card",
  ".admin-analytics-card",
  ".admin-management-card",
  ".admin-form-card",
  ".portal-card",
  ".detail-card",
  ".auth-card",
  ".portal-auth-card",
  ".staff-work-card",
  ".requirement-card",
].join(",");

/** Adds a restrained, one-time reveal as content enters the viewport. */
export default function ScrollMotion() {
  useEffect(() => {
    const root = document.getElementById("root");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !root || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observed = new WeakSet();
    const intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("motion-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -36px 0px" },
    );

    // Include the root element itself when it matches, then scan descendants once.
    const observeWithin = (node) => {
      if (!(node instanceof Element)) return;

      if (node.matches(REVEAL_SELECTOR)) observe(node);
      node.querySelectorAll(REVEAL_SELECTOR).forEach(observe);
    };

    const observe = (element) => {
      if (
        observed.has(element) ||
        element.closest(".portal-dashboard-page, .dashboard-layout")
      ) {
        return;
      }
      observed.add(element);
      element.classList.add("motion-reveal");
      intersectionObserver.observe(element);
    };

    observeWithin(root);

    // Ignore text-only mutations and inspect each inserted element subtree once.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) observeWithin(node);
        });
      });
    });

    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return null;
}
