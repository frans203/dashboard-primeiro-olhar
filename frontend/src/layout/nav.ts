import {
  FileUp,
  GitCompare,
  HeartPulse,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type PageKey =
  | "demographics"
  | "health"
  | "socioeconomic"
  | "crossings"
  | "csv";

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

/** Sidebar tabs. Icons per the visual identity (lucide-react, the only icon lib). */
export const NAV_ITEMS: NavItem[] = [
  { key: "demographics", label: "Demografia", icon: Users },
  { key: "health", label: "Saúde", icon: HeartPulse },
  { key: "socioeconomic", label: "Socioeconômico", icon: Wallet },
  { key: "crossings", label: "Cruzamentos", icon: GitCompare },
  // The four tabs above read the institute's dataset; this one reads an uploaded CSV.
  { key: "csv", label: "Analisar CSV", icon: FileUp },
];
