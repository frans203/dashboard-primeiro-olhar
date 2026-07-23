import { HealthSection } from "./sections/HealthSection";
import { PageHeader } from "./PageHeader";

/** Saúde e Desenvolvimento sobre os dados do Instituto (grid em `sections/HealthSection`). */
export function HealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saúde e Desenvolvimento"
        description="Dados neonatais, diagnóstico, doenças e terapias."
      />
      <HealthSection />
    </div>
  );
}
