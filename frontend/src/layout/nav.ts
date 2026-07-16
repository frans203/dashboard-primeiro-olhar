import {
  GitCompare,
  HeartPulse,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type PageKey = "demographics" | "health" | "socioeconomic" | "crossings";

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
];
