'use client';

import { useState } from 'react';
import { Transacao } from '@/lib/types';
import { updateTransacao } from '@/lib/api';
import { X, Edit3 } from 'lucide-react';

interface EditModalProps {
  transacao: Transacao;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionModal({ transacao, onClose, onSuccess }: EditModalProps) {
  const [descricao, setDescricao] = useState(transacao.descricao);
  const [valor, setValor] = useState(transacao.valor.toString());
  const [categoria, setCategoria] = useState(transacao.categoria);
  const [dataVencimento, setDataVencimento] = useState(transacao.data_vencimento || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await updateTransacao(transacao.id, {
        descricao,
        valor: parseFloat(valor),
        tipo: transacao.tipo,
        categoria,
        forma_pagamento: transacao.forma_pagamento,
        banco: transacao.banco || undefined,
        data_transacao: transacao.data_transacao,
        data_vencimento: dataVencimento || undefined,
        pago: transacao.pago,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar lançamento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-400" /> Editar Transação
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Categoria</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Data de Vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}