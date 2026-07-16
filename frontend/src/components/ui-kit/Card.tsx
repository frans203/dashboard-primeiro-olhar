import * as React from "react";

import {
  Card as BaseCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PanelCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Optional header title. */
  title?: React.ReactNode;
  /** Optional slot rendered on the right of the header (e.g. a filter button). */
  headerAction?: React.ReactNode;
  /** Overrides the inner content padding/layout. */
  contentClassName?: string;
}

/**
 * Brand content card (a chart/section container). Wraps the shadcn Card with a
 * consistent header + content layout. `className` overrides the card shell;
 * `contentClassName` overrides the content area. Forwards `...props` and `ref`.
 */
export const Card = React.forwardRef<HTMLDivElement, PanelCardProps>(
  ({ title, headerAction, className, contentClassName, children, ...props }, ref) => (
    <BaseCard ref={ref} className={cn("overflow-hidden", className)} {...props}>
      {(title || headerAction) && (
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          {title ? <CardTitle className="text-base">{title}</CardTitle> : <span />}
          {headerAction}
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </BaseCard>
  ),
);
Card.displayName = "PanelCard";
