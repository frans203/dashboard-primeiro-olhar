import { GitCompare, HeartPulse, Upload, Users, Wallet } from "lucide-react";
import * as React from "react";

import { CsvUploadCard } from "@/components/upload/CsvUploadCard";
import { Card, TabsBar, type TabItem } from "@/components/ui-kit";
import { useUploadStatus } from "@/hooks/useUploadStatus";
import { DataSourceProvider } from "@/stores/dataSourceContext";
import { CrossingsSection } from "./sections/CrossingsSection";
import { DemographicsSection } from "./sections/DemographicsSection";
import { HealthSection } from "./sections/HealthSection";
import { SocioeconomicSection } from "./sections/SocioeconomicSection";
import { PageHeader } from "./PageHeader";

/**
 * Analisar CSV — the four sidebar pages condensed into ONE page with horizontal tabs,
 * reading the CSV the user uploads instead of the institute's dataset.
 *
 * Nothing here re-implements a chart: the tabs render the same `sections/*` the sidebar
 * pages do, wrapped in `DataSourceProvider` so every query hook inside them hits
 * `/api/uploads/*`. Filters, per-chart stores and caching behave exactly as elsewhere.
 *
 * Uploading again replaces the dataset: the new `version` re-keys every query, so the
 * charts refetch by themselves (no manual invalidation anywhere).
 */
type TabKey = "demographics" | "health" | "socioeconomic" | "crossings";

const TABS: readonly TabItem<TabKey>[] = [
  { key: "demographics", label: "Demografia", icon: Users },
  { key: "health", label: "Saúde", icon: HeartPulse },
  { key: "socioeconomic", label: "Socioeconômico", icon: Wallet },
  { key: "crossings", label: "Cruzamentos", icon: GitCompare },
];

const SECTIONS: Record<TabKey, React.ReactNode> = {
  demographics: <DemographicsSection />,
  health: <HealthSection />,
  socioeconomic: <SocioeconomicSection />,
  crossings: <CrossingsSection />,
};

function EmptyState() {
  return (
    <Card contentClassName="flex flex-col items-center gap-2 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Upload className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-foreground">Nenhum CSV carregado</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Envie um arquivo acima para ver os gráficos de demografia, saúde,
        socioeconômico e cruzamentos calculados sobre os seus dados.
      </p>
    </Card>
  );
}

export function CsvAnalysisPage() {
  const [active, setActive] = React.useState<TabKey>("demographics");
  const status = useUploadStatus();
  const dataset = status.data ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analisar CSV"
        description="Envie um arquivo no formato do formulário e explore os mesmos gráficos sobre os seus dados."
      />

      <CsvUploadCard />

      {dataset ? (
        <DataSourceProvider source={{ name: "upload", version: dataset.version }}>
          <div className="space-y-6">
            <TabsBar items={TABS} active={active} onChange={setActive} />
            <div
              role="tabpanel"
              id={`panel-${active}`}
              aria-labelledby={`tab-${active}`}
            >
              {SECTIONS[active]}
            </div>
          </div>
        </DataSourceProvider>
      ) : status.isPending ? null : (
        <EmptyState />
      )}
    </div>
  );
}
