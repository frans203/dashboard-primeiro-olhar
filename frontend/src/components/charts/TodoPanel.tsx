import { Construction } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Placeholder for a chart that is not implemented yet. Keeps pages rendering and
 * documents WHAT to build (title) and its chart TYPE. Replace with a real chart by
 * copying `ExampleSexChart` (the molde).
 */
export interface TodoPanelProps {
  title: string;
  chartType: string;
  className?: string;
  height?: number;
}

export function TodoPanel({ title, chartType, className, height = 300 }: TodoPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center",
        className,
      )}
      style={{ minHeight: height }}
    >
      <Construction className="h-6 w-6 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">
        {chartType} · <span className="font-mono">// TODO</span>
      </p>
    </div>
  );
}
