import * as React from "react";

import { cn } from "@/lib/utils";

export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  /** Optional leading icon (lucide-react — the only icon library). */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsBarProps<K extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: readonly TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  /** Overrides the individual tab button style. */
  tabClassName?: string;
}

/**
 * Horizontal tab bar (brand-styled, ui-kit contract: `className` overrides via `cn`,
 * `...props`/`ref` forwarded).
 *
 * Built here rather than pulled from shadcn/Radix: the app needs one plain tablist and
 * that costs no new dependency. Accessibility is hand-wired to match what Radix gives —
 * `role="tablist"`, roving tabindex, ←/→/Home/End — and each tab is ~44px tall for
 * touch. On mobile the row scrolls horizontally instead of wrapping, so the page itself
 * never scrolls sideways.
 *
 * It only reports the selection; the caller renders the panel (and owns the
 * `role="tabpanel"` element).
 */
function TabsBarInner<K extends string>(
  { items, active, onChange, className, tabClassName, ...props }: TabsBarProps<K>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const refs = React.useRef(new Map<K, HTMLButtonElement | null>());

  function focusTab(key: K) {
    onChange(key);
    refs.current.get(key)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.key === active);
    if (index < 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      focusTab(items[(index + step + items.length) % items.length].key);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(items[0].key);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(items[items.length - 1].key);
    }
  }

  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    >
      {items.map((item) => {
        const selected = item.key === active;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            ref={(node) => {
              refs.current.set(item.key, node);
            }}
            type="button"
            role="tab"
            id={`tab-${item.key}`}
            aria-selected={selected}
            aria-controls={`panel-${item.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              tabClassName,
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** `forwardRef` erases generics; this cast keeps `TabItem<K>`/`onChange(K)` tied. */
export const TabsBar = React.forwardRef(TabsBarInner) as <K extends string>(
  props: TabsBarProps<K> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;
