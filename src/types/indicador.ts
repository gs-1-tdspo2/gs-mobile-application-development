export type IndicadorRegional = {
  id?: number;
  regiaoId?: number;
  regiaoNome?: string;
  nome?: string;
  valor?: number;
  unidade?: string;
  categoria?: string;
  medidoEm?: string;
  [key: string]: unknown;
};
