import { AppShell } from "@/layout/AppShell";
import { Providers } from "@/layout/Providers";
import type { PageKey } from "@/layout/nav";
import { CrossingsPage } from "@/pages/CrossingsPage";
import { DemographicsPage } from "@/pages/DemographicsPage";
import { HealthPage } from "@/pages/HealthPage";
import { SocioeconomicPage } from "@/pages/SocioeconomicPage";

const pages: Record<PageKey, React.ReactNode> = {
  demographics: <DemographicsPage />,
  health: <HealthPage />,
  socioeconomic: <SocioeconomicPage />,
  crossings: <CrossingsPage />,
};

export default function App() {
  return (
    <Providers>
      <AppShell pages={pages} />
    </Providers>
  );
}
