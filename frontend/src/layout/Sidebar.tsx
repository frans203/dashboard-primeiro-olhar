import * as React from "react";
import { Eye, Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type PageKey } from "./nav";

interface NavProps {
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

/** Brand logo: eye icon + wordmark. `compact` hides the wordmark. */
function BrandLogo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Eye className="h-5 w-5" />
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-sm font-semibold leading-tight text-foreground",
          compact && "hidden",
        )}
      >
        Instituto Primeiro Olhar
        <span className="block text-xs font-normal text-muted-foreground">
          Dashboard
        </span>
      </span>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
  collapsible,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onClick: () => void;
  /**
   * When true (desktop) the label is hidden while collapsed and revealed on
   * sidebar hover (`group-hover`). When false (mobile drawer) it is always shown.
   */
  collapsible: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          "whitespace-nowrap transition-opacity duration-150",
          collapsible ? "opacity-0 group-hover:opacity-100" : "opacity-100",
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

/**
 * Desktop sidebar: collapsed to icons (w-16); expands on hover (w-60) to reveal the
 * full logo and tab labels. Overlays content (content keeps a left inset of the
 * collapsed width). Hidden below `md`.
 */
export function DesktopSidebar({ active, onNavigate }: NavProps) {
  return (
    <aside
      className={cn(
        "group fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card md:flex",
        "w-16 hover:w-60 transition-[width] duration-200 ease-in-out",
      )}
    >
      <div className="flex h-16 items-center overflow-hidden px-3">
        {/* compact by default, full on hover */}
        <div className="group-hover:hidden">
          <BrandLogo compact />
        </div>
        <div className="hidden group-hover:block">
          <BrandLogo />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-hidden px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={active === item.key}
            onClick={() => onNavigate(item.key)}
            collapsible
          />
        ))}
      </nav>
    </aside>
  );
}

/**
 * Mobile top bar: collapsed bar with a menu button that opens a Sheet drawer holding
 * the logo and full labels. Selecting a tab closes the drawer. Shown below `md`.
 */
export function MobileNav({ active, onNavigate }: NavProps) {
  const [open, setOpen] = React.useState(false);

  const handleNavigate = (key: PageKey) => {
    onNavigate(key);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <div className="flex h-16 items-center border-b px-4">
            <BrandLogo />
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active === item.key}
                onClick={() => handleNavigate(item.key)}
                collapsible={false}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <BrandLogo compact />
    </header>
  );
}
