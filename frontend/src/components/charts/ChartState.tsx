import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Wraps a chart with consistent loading / error / empty states so every chart on the
 * dashboard behaves the same. Give it a fixed `height` to avoid layout shift.
 */
export interface ChartStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

export function ChartState({
  isLoading,
  isError,
  isEmpty,
  height = 300,
  className,
  children,
}: ChartStateProps) {
  const center =
    "flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground";

  if (isLoading) {
    return (
      <div className={cn(center, className)} style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Carregando…</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className={cn(center, "text-destructive", className)} style={{ height }}>
        <AlertCircle className="h-6 w-6" />
        <span>Não foi possível carregar os dados.</span>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className={cn(center, className)} style={{ height }}>
        <span>Sem dados para os filtros selecionados.</span>
      </div>
    );
  }
  return <div style={{ height }}>{children}</div>;
}
