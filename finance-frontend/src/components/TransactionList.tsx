'use client';

import { Transacao, CartaoCredito } from '@/lib/types';
import { Calendar, CreditCard, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ItemLancamento {
  id: string | number;
  isCartaoFatura?: boolean;
  cartaoId?: string;
  descricao: string;
  tipo: 'GANHO' | 'GASTO';
  valor: number;
  categoria: string;
  banco?: string | null;
  data_transacao: string;
  data_vencimento?: string | null;
  pago: boolean;
  transacaoOriginal?: Transacao;
}

interface Props {
  transacoes: Transacao[];
  cartoes?: CartaoCredito[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: number) => void;
  onToggleStatus?: (transacao: Transacao) => void;
  onPagarFaturaCartao?: (cartaoId: string) => void;
}

export function TransactionList({
  transacoes,
  cartoes = [],
  onEdit,
  onDelete,
  onToggleStatus,
  onPagarFaturaCartao,
}: Props) {
  // Converte transações normais em itens unificados
  const itensNormais: ItemLancamento[] = transacoes.map((t) => ({
    id: t.id,
    isCartaoFatura: false,
    descricao: t.descricao,
    tipo: t.tipo,
    valor: Number(t.valor),
    categoria: t.categoria,
    banco: t.banco,
    data_transacao: t.data_transacao,
    data_vencimento: t.data_vencimento,
    pago: t.pago,
    transacaoOriginal: t,
  }));

  // Gera faturas pendentes de cartões (faturaMensal > 0)
  const agora = new Date();
  const mesAtualStr = agora.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });

  const faturasPendentes: ItemLancamento[] = cartoes
    .filter((c) => Number(c.faturaMensal) > 0)
    .map((c) => ({
      id: `fatura-cartao-${c.id}`,
      isCartaoFatura: true,
      cartaoId: c.id,
      descricao: `Fatura Cartão: ${c.nome}`,
      tipo: 'GASTO',
      valor: Number(c.faturaMensal),
      categoria: 'Fatura de Cartão',
      banco: c.bandeira || 'Cartão',
      data_transacao: new Date().toISOString().split('T')[0],
      data_vencimento: `Dia ${c.diaVencimento} (${mesAtualStr})`,
      pago: false,
    }));

  const listaCompleta = [...faturasPendentes, ...itensNormais];

  if (listaCompleta.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
        <p className="text-sm text-slate-400">
          Nenhuma transação ou fatura pendente nesta conta ainda.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Utilize o formulário para adicionar ganhos/gastos ou cadastre um cartão de crédito.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
      {listaCompleta.map((item) => (
        <div
          key={item.id}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition ${
            item.isCartaoFatura
              ? 'bg-cyan-950/20 border-cyan-800/60 hover:border-cyan-600'
              : item.pago
              ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              : 'bg-amber-950/10 border-amber-900/40 hover:border-amber-700/60'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-slate-100 text-sm">{item.descricao}</p>
              {item.isCartaoFatura ? (
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Sugestão de Fatura
                </span>
              ) : item.pago ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pago
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Pendente
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px]">
                {item.categoria || 'Geral'}
              </span>
              {item.data_vencimento && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Vence: {item.data_vencimento}
                </span>
              )}
              {item.banco && !item.isCartaoFatura && (
                <span className="flex items-center gap-1 text-slate-400">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" /> {item.banco}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
            <span
              className={`font-semibold text-base font-mono ${
                item.tipo === 'GANHO' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {item.tipo === 'GANHO' ? '+' : '-'} R${' '}
              {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>

            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              {/* Ação de dar baixa em fatura do cartão */}
              {item.isCartaoFatura ? (
                <button
                  onClick={() => item.cartaoId && onPagarFaturaCartao && onPagarFaturaCartao(item.cartaoId)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition"
                  title="Dar baixa na fatura deste cartão"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dar Baixa
                </button>
              ) : (
                <>
                  {/* Botão de Alternar Pago / Pendente */}
                  <button
                    onClick={() => item.transacaoOriginal && onToggleStatus && onToggleStatus(item.transacaoOriginal)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                      item.pago
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                    title={item.pago ? 'Marcar como pendente' : 'Marcar conta como paga'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.pago ? 'PAGO' : 'Pagar'}
                  </button>

                  <button
                    onClick={() => item.transacaoOriginal && onEdit(item.transacaoOriginal)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition"
                    title="Editar transação"
                    aria-label="Editar transação"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => typeof item.id === 'number' && onDelete(item.id)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
                    title="Apagar transação"
                    aria-label="Apagar transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}