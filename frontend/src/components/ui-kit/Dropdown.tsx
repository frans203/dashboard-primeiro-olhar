import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  /** Overrides the trigger's base style via `cn`. */
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * Brand dropdown built on the shadcn Select. A thin, controlled presentational
 * wrapper: pass `options` + `value` + `onValueChange`. `className` overrides the
 * trigger style (tailwind-merge).
 */
export function Dropdown({
  value,
  onValueChange,
  options,
  placeholder = "Selecione…",
  className,
  disabled,
  ...props
}: DropdownProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)} aria-label={props["aria-label"]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
