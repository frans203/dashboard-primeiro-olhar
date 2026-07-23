/**
 * pt-BR labels for the filter enums. The API speaks English keys (`backend/enums.py`);
 * the UI speaks Portuguese — this is the only place the two meet on the filter side.
 *
 * The option lists are derived from the same `const` arrays that produce the TS unions
 * and the Zod enums (`types/filters.ts`), so adding a value there surfaces here as a
 * missing-label type error instead of a silently absent option.
 *
 * Income is special: the TSV stores brackets (not exact reais). Options mirror
 * `INCOME_BRACKETS` / `MINIMUM_WAGE` in `backend/cleaning.py`; selecting a bracket
 * sends that bracket's floor (`incomeMin`) or ceiling (`incomeMax`) to the API.
 */
import type { DropdownOption } from "@/components/ui-kit";
import {
  BENEFIT_VALUES,
  DELIVERY_TYPE_VALUES,
  PARENT_EDUCATION_VALUES,
  SEX_VALUES,
  type Benefit,
  type DeliveryType,
  type ParentEducation,
  type Sex,
} from "@/types/filters";

/**
 * Sentinel for "no filter". Radix Select forbids an empty-string item value, so the
 * "all" option carries this value and the filter bar maps it back to `undefined`.
 */
export const ALL_VALUE = "__all__";

function toOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
  allLabel: string,
): DropdownOption[] {
  return [
    { value: ALL_VALUE, label: allLabel },
    ...values.map((value) => ({ value, label: labels[value] })),
  ];
}

export const SEX_LABELS: Record<Sex, string> = {
  male: "Masculino",
  female: "Feminino",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  cesarean: "Cesárea",
  vaginal: "Normal",
};

export const BENEFIT_LABELS: Record<Benefit, string> = {
  bpc: "BPC",
  aid: "Auxílio governamental",
};

export const PARENT_EDUCATION_LABELS: Record<ParentEducation, string> = {
  notLiterate: "Não Alfabetizado",
  elementary: "Fundamental",
  highSchool: "Médio",
  higherIncomplete: "Superior incompleto",
  higherComplete: "Superior completo",
  postgraduate: "Pós-graduação",
};

export const SEX_OPTIONS = toOptions(SEX_VALUES, SEX_LABELS, "Todos");
export const DELIVERY_TYPE_OPTIONS = toOptions(
  DELIVERY_TYPE_VALUES,
  DELIVERY_TYPE_LABELS,
  "Todos",
);
export const BENEFIT_OPTIONS = toOptions(BENEFIT_VALUES, BENEFIT_LABELS, "Todos");
export const PARENT_EDUCATION_OPTIONS = toOptions(
  PARENT_EDUCATION_VALUES,
  PARENT_EDUCATION_LABELS,
  "Todas",
);

/** `nicu` is a boolean filter, so its options are hand-built rather than enum-derived. */
export const NICU_OPTIONS: DropdownOption[] = [
  { value: ALL_VALUE, label: "Todos" },
  { value: "true", label: "Internou na UTI" },
  { value: "false", label: "Não internou" },
];

// --------------------------------------------------------------------------- #
// Income brackets — mirror backend/cleaning.py (MINIMUM_WAGE + INCOME_BRACKETS)
// --------------------------------------------------------------------------- #

/** Must stay in sync with `MINIMUM_WAGE` in `backend/cleaning.py`. */
export const MINIMUM_WAGE = 1621;

export interface IncomeBracket {
  /** pt-BR label shown in the UI (same text the charts use). */
  label: string;
  /** Bracket floor in reais — sent as `incomeMin` when this option is chosen. */
  min: number;
  /** Bracket ceiling in reais — sent as `incomeMax` when this option is chosen. */
  max: number;
}

/**
 * Canonical income brackets from the dataset. Order is low → high.
 * The open-top bracket keeps the same finite sentinel ceiling as the backend.
 */
export const INCOME_BRACKETS: readonly IncomeBracket[] = [
  { label: "Menos de 1 salário mínimo", min: 0, max: MINIMUM_WAGE },
  { label: "1 a 3 salários mínimos", min: MINIMUM_WAGE, max: 3 * MINIMUM_WAGE },
  { label: "3 a 6 salários mínimos", min: 3 * MINIMUM_WAGE, max: 6 * MINIMUM_WAGE },
  { label: "6 a 10 salários mínimos", min: 6 * MINIMUM_WAGE, max: 10 * MINIMUM_WAGE },
  {
    label: "Mais de 10 salários mínimos",
    min: 10 * MINIMUM_WAGE,
    max: 500_000,
  },
];

/** Renda mín. — each option's value is the bracket floor (API `incomeMin`). */
export const INCOME_MIN_OPTIONS: DropdownOption[] = [
  { value: ALL_VALUE, label: "Todas" },
  ...INCOME_BRACKETS.map((b) => ({ value: String(b.min), label: b.label })),
];

/** Renda máx. — each option's value is the bracket ceiling (API `incomeMax`). */
export const INCOME_MAX_OPTIONS: DropdownOption[] = [
  { value: ALL_VALUE, label: "Todas" },
  ...INCOME_BRACKETS.map((b) => ({ value: String(b.max), label: b.label })),
];
