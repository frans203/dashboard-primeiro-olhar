import { RotateCcw } from "lucide-react";
import * as React from "react";

import {
  NumberFilterField,
  SecondaryButton,
  SelectFilterField,
} from "@/components/ui-kit";
import { useCities } from "@/hooks/useCities";
import {
  ALL_VALUE,
  BENEFIT_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  NICU_OPTIONS,
  PARENT_EDUCATION_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/filter-options";
import { cn } from "@/lib/utils";
import {
  useChartFilterActions,
  useChartFilters,
} from "@/stores/chartFilterContext";
import {
  BENEFIT_VALUES,
  DELIVERY_TYPE_VALUES,
  PARENT_EDUCATION_VALUES,
  SEX_VALUES,
} from "@/types/filters";

/**
 * The filter bar of ONE chart instance. It reads and writes that instance's Zustand
 * store through the context hooks — no prop drilling, no filter state passed in.
 *
 * Charts declare which controls they want (`fields`); a chart NEVER declares the field
 * of its own axis, and `ROUTE_FILTERS` (api/endpoints) drops anything its route would
 * not honour anyway.
 *
 * `age` and `income` each render a min/max pair (`ageMin`/`ageMax`,
 * `incomeMin`/`incomeMax` — incomes in reais), matching the API's range params.
 */
export type FilterFieldKey =
  | "city"
  | "age"
  | "income"
  | "parentEducation"
  | "benefit"
  | "sex"
  | "deliveryType"
  | "nicu";

/** Runtime-checked narrowing from a dropdown's string back to a filter enum. */
function asEnum<T extends string>(values: readonly T[], value: string): T | undefined {
  return (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Empty / malformed input clears the filter instead of sending NaN. */
function asCount(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : undefined;
}

export interface ChartFilterBarProps {
  fields: readonly FilterFieldKey[];
  className?: string;
}

export function ChartFilterBar({ fields, className }: ChartFilterBarProps) {
  const filters = useChartFilters();
  const { setFilter, reset } = useChartFilterActions();
  const cities = useCities();
  // Unique per instance, so two mounts of the same chart keep their labels bound to
  // their own inputs.
  const uid = React.useId();

  const hasFilters = Object.keys(filters).length > 0;
  const has = (field: FilterFieldKey) => fields.includes(field);

  const cityOptions = React.useMemo(
    () => [{ value: ALL_VALUE, label: "Todas" }, ...(cities.data ?? [])],
    [cities.data],
  );

  return (
    <div
      className={cn(
        "mb-4 grid grid-cols-1 gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {has("city") && (
        <SelectFilterField
          label="Cidade"
          options={cityOptions}
          value={filters.city ?? ALL_VALUE}
          onValueChange={(v) => setFilter("city", v === ALL_VALUE ? undefined : v)}
          disabled={!cities.data}
          placeholder={cities.isError ? "Indisponível" : "Todas"}
        />
      )}

      {has("age") && (
        <>
          <NumberFilterField
            label="Idade mín. (anos)"
            id={`${uid}-age-min`}
            min={0}
            value={filters.ageMin ?? ""}
            onChange={(e) => setFilter("ageMin", asCount(e.target.value))}
          />
          <NumberFilterField
            label="Idade máx. (anos)"
            id={`${uid}-age-max`}
            min={0}
            value={filters.ageMax ?? ""}
            onChange={(e) => setFilter("ageMax", asCount(e.target.value))}
          />
        </>
      )}

      {has("income") && (
        <>
          <NumberFilterField
            label="Renda mín. (R$)"
            id={`${uid}-income-min`}
            min={0}
            step={100}
            value={filters.incomeMin ?? ""}
            onChange={(e) => setFilter("incomeMin", asCount(e.target.value))}
          />
          <NumberFilterField
            label="Renda máx. (R$)"
            id={`${uid}-income-max`}
            min={0}
            step={100}
            value={filters.incomeMax ?? ""}
            onChange={(e) => setFilter("incomeMax", asCount(e.target.value))}
          />
        </>
      )}

      {has("parentEducation") && (
        <SelectFilterField
          label="Escolaridade dos pais"
          options={PARENT_EDUCATION_OPTIONS}
          value={filters.parentEducation ?? ALL_VALUE}
          onValueChange={(v) =>
            setFilter("parentEducation", asEnum(PARENT_EDUCATION_VALUES, v))
          }
        />
      )}

      {has("benefit") && (
        <SelectFilterField
          label="Benefício"
          options={BENEFIT_OPTIONS}
          value={filters.benefit ?? ALL_VALUE}
          onValueChange={(v) => setFilter("benefit", asEnum(BENEFIT_VALUES, v))}
        />
      )}

      {has("sex") && (
        <SelectFilterField
          label="Sexo"
          options={SEX_OPTIONS}
          value={filters.sex ?? ALL_VALUE}
          onValueChange={(v) => setFilter("sex", asEnum(SEX_VALUES, v))}
        />
      )}

      {has("deliveryType") && (
        <SelectFilterField
          label="Tipo de parto"
          options={DELIVERY_TYPE_OPTIONS}
          value={filters.deliveryType ?? ALL_VALUE}
          onValueChange={(v) =>
            setFilter("deliveryType", asEnum(DELIVERY_TYPE_VALUES, v))
          }
        />
      )}

      {has("nicu") && (
        <SelectFilterField
          label="UTI ao nascer"
          options={NICU_OPTIONS}
          value={filters.nicu === undefined ? ALL_VALUE : String(filters.nicu)}
          onValueChange={(v) =>
            setFilter("nicu", v === "true" ? true : v === "false" ? false : undefined)
          }
        />
      )}

      <div className="flex items-end sm:col-span-2 lg:col-span-3 lg:justify-end">
        <SecondaryButton
          variant="outline"
          onClick={reset}
          disabled={!hasFilters}
          className="w-full gap-2 sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar filtros
        </SecondaryButton>
      </div>
    </div>
  );
}
