import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Dropdown, type DropdownOption } from "./Dropdown";

/**
 * Reusable labelled filter fields. Two flavours share a consistent layout so filter
 * bars look uniform across charts:
 *  - `SelectFilterField` — a labelled {@link Dropdown} (enum-style filters).
 *  - `NumberFilterField` — a labelled numeric {@link Input} (age / income filters).
 *
 * Both accept `className` (overrides the wrapper) and forward native props.
 */

interface FieldShellProps {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

function FieldShell({ label, htmlFor, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export interface SelectFilterFieldProps {
  label: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}

export function SelectFilterField({
  label,
  className,
  ...dropdown
}: SelectFilterFieldProps) {
  return (
    <FieldShell label={label} className={className}>
      <Dropdown {...dropdown} aria-label={label} />
    </FieldShell>
  );
}

export interface NumberFilterFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  className?: string;
}

export const NumberFilterField = React.forwardRef<
  HTMLInputElement,
  NumberFilterFieldProps
>(({ label, className, id, ...props }, ref) => (
  <FieldShell label={label} htmlFor={id} className={className}>
    <Input ref={ref} id={id} type="number" inputMode="numeric" {...props} />
  </FieldShell>
));
NumberFilterField.displayName = "NumberFilterField";
