import * as React from "react";

import { DesktopSidebar, MobileNav } from "./Sidebar";
import type { PageKey } from "./nav";

/**
 * App shell: responsive frame with the desktop hover-sidebar and the mobile drawer.
 * Holds the active-page state (lightweight, no router dependency) and renders the
 * page for the active tab via the `pages` map.
 */
export function AppShell({ pages }: { pages: Record<PageKey, React.ReactNode> }) {
  const [active, setActive] = React.useState<PageKey>("demographics");

  return (
    // No opaque background here: the body carries `bg-background`, and the decorative
    // `.app-bg` blobs sit between it and the (transparent) content so they show through
    // the gaps around the cards.
    <div className="min-h-screen">
      <div className="app-bg" aria-hidden="true" />
      <MobileNav active={active} onNavigate={setActive} />
      <DesktopSidebar active={active} onNavigate={setActive} />
      {/* content is inset by the collapsed sidebar width on desktop */}
      <main className="md:pl-16">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {pages[active]}
        </div>
      </main>
    </div>
  );
}
