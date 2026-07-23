import { DemographicsSection } from "./sections/DemographicsSection";
import { PageHeader } from "./PageHeader";

/**
 * Demografia sobre os dados do Instituto. The charts themselves live in
 * `sections/DemographicsSection` so the "Analisar CSV" page renders the same grid over
 * the uploaded file.
 */
export function DemographicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Demografia"
        description="Perfil das crianças: idade, sexo, cidades e maternidades."
      />
      <DemographicsSection />
    </div>
  );
}
