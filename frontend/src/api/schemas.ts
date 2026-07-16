/**
 * Zod schemas — validate every API response at the boundary (when it enters the
 * TanStack Query cache) and infer the TypeScript response types from a single source.
 *
 * These mirror `backend/dtos.py`. Distribution endpoints use the uniform
 * `{ label, count }` item shape (`labelCount`).
 */
import { z } from "zod";

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
