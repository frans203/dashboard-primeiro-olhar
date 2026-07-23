/**
 * Zod schemas — the boundary in both directions:
 *  - every API RESPONSE is validated on its way INTO the Query cache, and the response
 *    TypeScript types are inferred from these schemas (single source of truth);
 *  - every FILTERS object is validated before it becomes a query string.
 *
 * These mirror `backend/dtos.py`. Distribution endpoints use the uniform
 * `{ label, count }` item shape (`labelCount`).
 */
import { z } from "zod";

import {
  BENEFIT_VALUES,
  DELIVERY_TYPE_VALUES,
  PARENT_EDUCATION_VALUES,
  SEX_VALUES,
  type Filters,
} from "@/types/filters";

// --- filters (outbound) --------------------------------------------------- //

/**
 * Validates the filters of a chart before they are serialized into a query string.
 * Every filter is optional; the enums are the same `const` arrays that produce the TS
 * unions in `types/filters.ts`. Ages must be non-negative integers; incomes are
 * bracket floors/ceilings chosen from the dataset faixas (see `lib/filter-options.ts`),
 * still sent as non-negative integers in reais. Unknown keys are stripped so a chart
 * can never smuggle a param its route does not accept.
 */
export const filtersSchema = z.object({
  city: z.string().trim().min(1).optional(),
  ageMin: z.number().int().nonnegative().optional(),
  ageMax: z.number().int().nonnegative().optional(),
  incomeMin: z.number().int().nonnegative().optional(),
  incomeMax: z.number().int().nonnegative().optional(),
  therapy: z.string().min(1).optional(),
  parentEducation: z.enum(PARENT_EDUCATION_VALUES).optional(),
  benefit: z.enum(BENEFIT_VALUES).optional(),
  sex: z.enum(SEX_VALUES).optional(),
  deliveryType: z.enum(DELIVERY_TYPE_VALUES).optional(),
  nicu: z.boolean().optional(),
}) satisfies z.ZodType<Partial<Filters>, z.ZodTypeDef, unknown>;

export const keyLabel = z.object({
  key: z.string(),
  label: z.string(),
});
export type KeyLabel = z.infer<typeof keyLabel>;

export const labelCount = z.object({
  label: z.string(),
  count: z.number(),
});
export type LabelCount = z.infer<typeof labelCount>;

// --- /api/filters/therapies (implemented) --------------------------------- //
export const therapiesFilterResponse = z.object({
  therapies: z.array(keyLabel),
});
export type TherapiesFilterResponse = z.infer<typeof therapiesFilterResponse>;

// --- /api/demographics ---------------------------------------------------- //
export const demographicsResponse = z.object({
  ageDistribution: z.array(labelCount),
  sexDistribution: z.array(labelCount),
  topCities: z.array(labelCount),
  topMaternities: z.array(labelCount),
});
export type DemographicsResponse = z.infer<typeof demographicsResponse>;

// --- /api/neonatal -------------------------------------------------------- //
export const neonatalResponse = z.object({
  apgar1minAvg: z.number().nullable(),
  apgar5minAvg: z.number().nullable(),
  deliveryType: z.array(labelCount),
  nicuRate: z.number(),
  complications: z.array(labelCount),
});
export type NeonatalResponse = z.infer<typeof neonatalResponse>;

// --- /api/diagnosis ------------------------------------------------------- //
export const diagnosisResponse = z.object({
  diagnosisMoment: z.array(labelCount),
});
export type DiagnosisResponse = z.infer<typeof diagnosisResponse>;

// --- /api/health ---------------------------------------------------------- //
export const healthResponse = z.object({
  frequentDiseases: z.array(labelCount),
  surgeryRate: z.array(labelCount),
});
export type HealthResponse = z.infer<typeof healthResponse>;

// --- /api/therapies ------------------------------------------------------- //
export const therapiesResponse = z.object({
  therapyRate: z.number(),
  topTherapies: z.array(labelCount),
});
export type TherapiesResponse = z.infer<typeof therapiesResponse>;

// --- /api/socioeconomic --------------------------------------------------- //
export const parentEducationRow = z.object({
  label: z.string(),
  mother: z.number(),
  father: z.number(),
});
export type ParentEducationRow = z.infer<typeof parentEducationRow>;

export const socialBenefitRow = z.object({
  label: z.string(),
  receives: z.number(),
  doesNotReceive: z.number(),
});
export type SocialBenefitRow = z.infer<typeof socialBenefitRow>;

export const socioeconomicResponse = z.object({
  incomeDistribution: z.array(labelCount),
  familyStructure: z.array(labelCount),
  parentEducation: z.array(parentEducationRow),
  socialBenefits: z.array(socialBenefitRow),
});
export type SocioeconomicResponse = z.infer<typeof socioeconomicResponse>;

// --- /api/crossings/* ----------------------------------------------------- //
export const incomeTherapiesResponse = z.object({
  rows: z.array(
    z.object({
      income: z.string(),
      withTherapy: z.number(),
      withoutTherapy: z.number(),
    }),
  ),
});
export type IncomeTherapiesResponse = z.infer<typeof incomeTherapiesResponse>;

export const deliveryComplicationsResponse = z.object({
  rows: z.array(
    z.object({
      deliveryType: z.string(),
      withComplications: z.number(),
      withoutComplications: z.number(),
    }),
  ),
});
export type DeliveryComplicationsResponse = z.infer<
  typeof deliveryComplicationsResponse
>;

export const bpcIncomeResponse = z.object({
  rows: z.array(
    z.object({
      income: z.string(),
      receivesBpc: z.number(),
      doesNotReceiveBpc: z.number(),
    }),
  ),
});
export type BpcIncomeResponse = z.infer<typeof bpcIncomeResponse>;

// --- /api/indicators ------------------------------------------------------ //
export const indicatorsResponse = z.object({
  apgar1minAvg: z.number().nullable(),
  apgar5minAvg: z.number().nullable(),
  therapyRate: z.number(),
  surgeryRate: z.number(),
  totalChildren: z.number(),
});
export type IndicatorsResponse = z.infer<typeof indicatorsResponse>;

// --- /api/uploads (the uploaded CSV slot) --------------------------------- //
/** Metadata of the CSV currently loaded — mirrors `UploadStatusResponse` in the API. */
export const uploadStatusResponse = z.object({
  filename: z.string(),
  rowCount: z.number(),
  uploadedAt: z.string(),
  version: z.number(),
  warnings: z.array(z.string()),
});
export type UploadStatusResponse = z.infer<typeof uploadStatusResponse>;
