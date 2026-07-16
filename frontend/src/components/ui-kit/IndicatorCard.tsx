import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Card as BaseCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface IndicatorCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Small helper text under the value (e.g. "de 355 crianças"). */
  hint?: string;
  icon?: LucideIcon;
  /** Loading skeleton state. */
  loading?: boolean;
}

/**
 * Top-of-page KPI card (Apgar averages, % therapy, % surgery, total children).
 * `className` overrides the shell; forwards `...props` and `ref`.
 */
export const IndicatorCard = React.forwardRef<HTMLDivElement, IndicatorCardProps>(
  ({ label, value, hint, icon: Icon, loading, className, ...props }, ref) => (
    <BaseCard
      ref={ref}
      className={cn(
        "flex flex-col gap-2 p-5",
        "bg-gradient-to-br from-brand-blue-soft/60 to-card",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon ? (
          <span className="rounded-full bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </span>
      )}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </BaseCard>
  ),
);
IndicatorCard.displayName = "IndicatorCard";
