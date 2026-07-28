'use client';

import { Transacao } from '@/lib/types';
import { Calendar, CreditCard, Edit2, Trash2 } from 'lucide-react';

interface Props {
  transacoes: Transacao[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: number) => void;
}

export function TransactionList({ transacoes, onEdit, onDelete }: Props) {
  if (transacoes.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
        <p className="text-sm text-slate-400">
          Nenhuma transação registrada nesta conta ainda.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Utilize o formulário para adicionar ganhos ou gastos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {transacoes.map((t) => (
        <div
          key={t.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-100 text-sm">{t.descricao}</p>
              {!t.pago && (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Pendente
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px]">
                {t.categoria || 'Geral'}
              </span>
              {t.data_vencimento && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Vence: {t.data_vencimento}
                </span>
              )}
              {t.banco && (
                <span className="flex items-center gap-1 text-slate-400">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" /> {t.banco}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
            <span
              className={`font-semibold text-base font-mono ${
                t.tipo === 'GANHO' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {t.tipo === 'GANHO' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={() => onEdit(t)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition"
                title="Editar transação"
                aria-label="Editar transação"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(t.id)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
                title="Apagar transação"
                aria-label="Apagar transação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}