import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Brand primary action button.
 *
 * ui-kit pattern (followed by every component here):
 *  - encapsulates the base identity style;
 *  - accepts `className` that OVERRIDES the base via `cn`/tailwind-merge
 *    (`<PrimaryButton className="p-6" />` bumps padding without breaking the style);
 *  - forwards `...props` and `ref` to the underlying element;
 *  - typed by extending the underlying element's props.
 */
export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="default"
      className={cn("shadow-sm", className)}
      {...props}
    />
  ),
);
PrimaryButton.displayName = "PrimaryButton";
