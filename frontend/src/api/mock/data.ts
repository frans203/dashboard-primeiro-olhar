/**
 * ⚠️ DADOS FICTÍCIOS — apenas para demonstração/gravação. NÃO são dados reais do
 * Instituto. Para remover, veja `src/api/mock/index.ts`.
 *
 * Os números são inventados, mas coerentes entre si: 355 crianças no total, e os
 * cruzamentos batem com as distribuições e com as taxas dos indicadores (ex.: as
 * crianças "com terapia" do cruzamento renda × terapias somam 241 = 68% de 355 =
 * `therapyRate`). Isso importa: numa demonstração, número que não fecha é a primeira
 * coisa que alguém repara.
 */
import type * as S from "@/api/schemas";

export const TOTAL = 355;

export const therapiesFilter: S.TherapiesFilterResponse = {
  therapies: [
    { key: "physiotherapy", label: "Fisioterapia" },
    { key: "speechTherapy", label: "Fonoaudiologia" },
    { key: "occupationalTherapy", label: "Terapia Ocupacional" },
    { key: "psychology", label: "Psicologia" },
    { key: "psychopedagogy", label: "Psicopedagogia" },
    { key: "equineTherapy", label: "Equoterapia" },
    { key: "musicTherapy", label: "Musicoterapia" },
    { key: "swimming", label: "Natação" },
  ],
};

export const demographics: S.DemographicsResponse = {
  ageDistribution: [
    { label: "0 a 2 anos", count: 78 },
    { label: "3 a 5 anos", count: 96 },
    { label: "6 a 10 anos", count: 92 },
    { label: "11 a 15 anos", count: 54 },
    { label: "16 anos ou mais", count: 35 },
  ],
  sexDistribution: [
    { label: "Masculino", count: 187 },
    { label: "Feminino", count: 168 },
  ],
  topCities: [
    { label: "Belo Horizonte", count: 132 },
    { label: "Contagem", count: 41 },
    { label: "Betim", count: 28 },
    { label: "Ribeirão das Neves", count: 22 },
    { label: "Santa Luzia", count: 19 },
    { label: "Nova Lima", count: 14 },
    { label: "Sabará", count: 12 },
    { label: "Ibirité", count: 11 },
    { label: "Vespasiano", count: 9 },
    { label: "Lagoa Santa", count: 8 },
    { label: "Outras", count: 59 },
  ],
  topMaternities: [
    { label: "Hospital Sofia Feldman", count: 64 },
    { label: "Mat. Odete Valadares", count: 52 },
    { label: "Hospital Júlia Kubitschek", count: 38 },
    { label: "Hospital das Clínicas UFMG", count: 33 },
    { label: "Hospital Risoleta Neves", count: 27 },
    { label: "Hospital Mun. de Contagem", count: 21 },
    { label: "Hospital Vera Cruz", count: 18 },
    { label: "Mat. Otaviano Neves", count: 15 },
    { label: "Hospital Mater Dei", count: 13 },
    { label: "Hospital Semper", count: 11 },
  ],
};

export const neonatal: S.NeonatalResponse = {
  apgar1minAvg: 7.8,
  apgar5minAvg: 8.9,
  deliveryType: [
    { label: "Cesárea", count: 241 },
    { label: "Normal", count: 114 },
  ],
  nicuRate: 0.42,
  complications: [
    { label: "Icterícia", count: 84 },
    { label: "Dificuldade respiratória", count: 61 },
    { label: "Hipotonia", count: 44 },
    { label: "Cardiopatia congênita", count: 39 },
    { label: "Hipoglicemia", count: 22 },
    { label: "Infecção neonatal", count: 17 },
  ],
};

export const diagnosis: S.DiagnosisResponse = {
  diagnosisMoment: [
    { label: "Após o nascimento", count: 198 },
    { label: "Durante a gestação", count: 121 },
    { label: "Meses após o nascimento", count: 29 },
    { label: "Não informado", count: 7 },
  ],
};

export const health: S.HealthResponse = {
  frequentDiseases: [
    { label: "Cardiopatia congênita", count: 142 },
    { label: "Hipotireoidismo", count: 88 },
    { label: "Refluxo gastroesofágico", count: 61 },
    { label: "Apneia do sono", count: 47 },
    { label: "Otite recorrente", count: 39 },
    { label: "Problemas de visão", count: 35 },
    { label: "Doença celíaca", count: 12 },
  ],
  surgeryRate: [
    { label: "Fez cirurgia cardíaca", count: 121 },
    { label: "Não fez", count: 234 },
  ],
};

export const therapies: S.TherapiesResponse = {
  therapyRate: 0.68,
  topTherapies: [
    { label: "Fisioterapia", count: 214 },
    { label: "Fonoaudiologia", count: 187 },
    { label: "Terapia Ocupacional", count: 156 },
    { label: "Psicologia", count: 84 },
    { label: "Psicopedagogia", count: 61 },
    { label: "Equoterapia", count: 34 },
    { label: "Musicoterapia", count: 28 },
    { label: "Natação", count: 21 },
  ],
};

export const socioeconomic: S.SocioeconomicResponse = {
  incomeDistribution: [
    { label: "Até 1 salário", count: 96 },
    { label: "1 a 2 salários", count: 128 },
    { label: "2 a 3 salários", count: 71 },
    { label: "3 a 5 salários", count: 42 },
    { label: "Mais de 5 salários", count: 18 },
  ],
  familyStructure: [
    { label: "Casada", count: 189 },
    { label: "Solteira", count: 92 },
    { label: "União estável", count: 48 },
    { label: "Divorciada", count: 21 },
    { label: "Viúva", count: 5 },
  ],
  parentEducation: [
    { label: "Não Alfabetizado", mother: 4, father: 6 },
    { label: "Fundamental", mother: 62, father: 78 },
    { label: "Médio", mother: 158, father: 149 },
    { label: "Superior incompleto", mother: 41, father: 38 },
    { label: "Superior completo", mother: 71, father: 62 },
    { label: "Pós-graduação", mother: 19, father: 12 },
  ],
  socialBenefits: [
    { label: "BPC", receives: 148, doesNotReceive: 207 },
    { label: "Auxílio governamental", receives: 96, doesNotReceive: 259 },
  ],
};

export const incomeTherapies: S.IncomeTherapiesResponse = {
  rows: [
    { income: "Até 1 salário", withTherapy: 51, withoutTherapy: 45 },
    { income: "1 a 2 salários", withTherapy: 84, withoutTherapy: 44 },
    { income: "2 a 3 salários", withTherapy: 54, withoutTherapy: 17 },
    { income: "3 a 5 salários", withTherapy: 35, withoutTherapy: 7 },
    { income: "Mais de 5 salários", withTherapy: 17, withoutTherapy: 1 },
  ],
};

export const deliveryComplications: S.DeliveryComplicationsResponse = {
  rows: [
    { deliveryType: "Cesárea", withComplications: 98, withoutComplications: 143 },
    { deliveryType: "Normal", withComplications: 39, withoutComplications: 75 },
  ],
};

export const bpcIncome: S.BpcIncomeResponse = {
  rows: [
    { income: "Até 1 salário", receivesBpc: 62, doesNotReceiveBpc: 34 },
    { income: "1 a 2 salários", receivesBpc: 58, doesNotReceiveBpc: 70 },
    { income: "2 a 3 salários", receivesBpc: 21, doesNotReceiveBpc: 50 },
    { income: "3 a 5 salários", receivesBpc: 6, doesNotReceiveBpc: 36 },
    { income: "Mais de 5 salários", receivesBpc: 1, doesNotReceiveBpc: 17 },
  ],
};

export const indicators: S.IndicatorsResponse = {
  apgar1minAvg: 7.8,
  apgar5minAvg: 8.9,
  therapyRate: 0.68,
  surgeryRate: 0.34,
  totalChildren: TOTAL,
};
