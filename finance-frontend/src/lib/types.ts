export type TipoTransacao = 'GANHO' | 'GASTO';

export type FormaPagamento =
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'PIX'
  | 'BOLETO'
  | 'DINHEIRO';

export interface Transacao {
  id: number;
  descricao: string;
  tipo: TipoTransacao;
  valor: number;
  categoria: string;
  forma_pagamento: FormaPagamento;
  banco?: string | null;
  data_transacao: string;
  data_vencimento?: string | null;
  pago: boolean;
}

export interface Balanco {
  total_ganhos: number;
  total_gastos: number;
  despesas_pendentes: number;
  despesas_pagas: number;
  saldo_atual: number;
}

export interface CartaoCredito {
  id: string;
  nome: string;
  bandeira?: string;
  limiteTotal: number;
  limiteUsado: number; // Montante Total Comprometido (Parcelados a vencer)
  faturaMensal: number; // Fatura exata do Mês Atual
  diaFechamento: number;
  diaVencimento: number;
  saldoInvestimento?: number;
  detalhes?: string;
  corHex?: string;
}