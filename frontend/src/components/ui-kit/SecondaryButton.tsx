import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Brand secondary action button. Defaults to the soft "secondary" (pastel yellow)
 * variant; pass `variant="outline"` for the outlined form. Same override/forwarding
 * contract as {@link PrimaryButton}.
 */
export const SecondaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      className={cn("shadow-sm", className)}
      {...props}
    />
  ),
);
SecondaryButton.displayName = "SecondaryButton";
