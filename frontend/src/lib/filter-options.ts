/**
 * pt-BR labels for the filter enums. The API speaks English keys (`backend/enums.py`);
 * the UI speaks Portuguese — this is the only place the two meet on the filter side.
 *
 * The option lists are derived from the same `const` arrays that produce the TS unions
 * and the Zod enums (`types/filters.ts`), so adding a value there surfaces here as a
 * missing-label type error instead of a silently absent option.
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
