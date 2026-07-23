import { SocioeconomicSection } from "./sections/SocioeconomicSection";
import { PageHeader } from "./PageHeader";

/** Socioeconômico sobre os dados do Instituto (grid em `sections/SocioeconomicSection`). */
export function SocioeconomicPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Socioeconômico"
        description="Renda, escolaridade dos pais, estrutura familiar e benefícios."
      />
      <SocioeconomicSection />
    </div>
  );
}
