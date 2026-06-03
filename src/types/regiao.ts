export type Regiao = {
  id: number;
  nome: string;
  municipio?: string;
  estado?: string;
  bioma?: string;
  descricao?: string;
  latitude?: number;
  longitude?: number;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  [key: string]: unknown;
};

export type RegiaoCreateRequest = {
  nome: string;
  municipio?: string;
  estado?: string;
  bioma?: string;
  descricao?: string;
  latitude?: number;
  longitude?: number;
};

export type RegiaoUpdateRequest = Partial<RegiaoCreateRequest> & {
  ativo?: boolean;
};
