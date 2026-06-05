export type IndicadorRegional = {
  idIndicador?: number;
  idRegiao?: number | null;
  nomeRegiao?: string | null;
  estado?: string;
  cidade?: string;
  tipoRisco?: string;
  scoreMedio?: number;
  nivelRiscoMedio?: string;
  quantidadeEstacoes?: number;
  quantidadeAlertasAtivos?: number;
  fonteCalculo?: string;
  dtCalculo?: string;
  [key: string]: unknown;
};
