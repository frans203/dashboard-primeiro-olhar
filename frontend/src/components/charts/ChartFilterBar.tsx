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
  INCOME_MAX_OPTIONS,
  INCOME_MIN_OPTIONS,
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
 * `age` is a free numeric min/max pair. `income` is a pair of bracket dropdowns
 * (dataset stores faixas, not exact reais) — the selected bracket's floor/ceiling is
 * sent as `incomeMin` / `incomeMax`.
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

/** Bracket option value → number, or `undefined` when "Todas" is chosen. */
function asIncomeBound(raw: string): number | undefined {
  if (raw === ALL_VALUE) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
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

  // Keep min/max bracket lists coherent: a max option below the selected floor (or a
  // min option above the selected ceiling) cannot produce rows with the current API.
  const incomeMinOptions = React.useMemo(() => {
    if (filters.incomeMax === undefined) return INCOME_MIN_OPTIONS;
    return INCOME_MIN_OPTIONS.filter(
      (opt) => opt.value === ALL_VALUE || Number(opt.value) <= filters.incomeMax!,
    );
  }, [filters.incomeMax]);

  const incomeMaxOptions = React.useMemo(() => {
    if (filters.incomeMin === undefined) return INCOME_MAX_OPTIONS;
    const floor = filters.incomeMin;
    return INCOME_MAX_OPTIONS.filter(
      (opt) => opt.value === ALL_VALUE || Number(opt.value) >= floor,
    );
  }, [filters.incomeMin]);

  // Drop a bound that became invalid after the other side changed (e.g. min raised
  // above the current max).
  React.useEffect(() => {
    if (
      filters.incomeMin !== undefined &&
      filters.incomeMax !== undefined &&
      filters.incomeMin > filters.incomeMax
    ) {
      setFilter("incomeMax", undefined);
    }
  }, [filters.incomeMin, filters.incomeMax, setFilter]);

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
          <SelectFilterField
            label="Renda mín."
            options={incomeMinOptions}
            value={
              filters.incomeMin !== undefined ? String(filters.incomeMin) : ALL_VALUE
            }
            onValueChange={(v) => setFilter("incomeMin", asIncomeBound(v))}
            placeholder="Todas"
          />
          <SelectFilterField
            label="Renda máx."
            options={incomeMaxOptions}
            value={
              filters.incomeMax !== undefined ? String(filters.incomeMax) : ALL_VALUE
            }
            onValueChange={(v) => setFilter("incomeMax", asIncomeBound(v))}
            placeholder="Todas"
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
