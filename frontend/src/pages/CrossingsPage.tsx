import { CrossingsSection } from "./sections/CrossingsSection";
import { PageHeader } from "./PageHeader";

/** Cruzamentos sobre os dados do Instituto (grid em `sections/CrossingsSection`). */
export function CrossingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cruzamentos"
        description="Relações entre renda, terapias, tipo de parto, intercorrências e BPC."
      />
      <CrossingsSection />
    </div>
  );
}
