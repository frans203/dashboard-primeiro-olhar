/**
 * Response types — mirror the backend Pydantic response DTOs (`backend/dtos.py`).
 * The Zod schemas in `src/api/schemas.ts` are the runtime source; these types are
 * inferred from them so the two never drift. Re-exported here for ergonomic imports.
 */
export type {
  KeyLabel,
  LabelCount,
  TherapiesFilterResponse,
  DemographicsResponse,
  NeonatalResponse,
  DiagnosisResponse,
  HealthResponse,
  TherapiesResponse,
  SocioeconomicResponse,
  ParentEducationRow,
  SocialBenefitRow,
  IncomeTherapiesResponse,
  DeliveryComplicationsResponse,
  BpcIncomeResponse,
  IndicatorsResponse,
} from "@/api/schemas";
