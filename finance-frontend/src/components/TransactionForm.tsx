'use client';

import { createTransacao, updateTransacao } from '@/lib/api';
import { FormaPagamento, TipoTransacao, Transacao } from '@/lib/types';
import { PlusCircle, Edit3, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  onSuccess: () => void;
  editingTransaction?: Transacao | null;
  onCancelEdit?: () => void;
}

export function TransactionForm({ onSuccess, editingTransaction, onCancelEdit }: Props) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TipoTransacao>('GASTO');
  const [categoria, setCategoria] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [banco, setBanco] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [pago, setPago] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setDescricao(editingTransaction.descricao);
      setValor(editingTransaction.valor.toString());
      setTipo(editingTransaction.tipo);
      setCategoria(editingTransaction.categoria);
      setFormaPagamento(editingTransaction.forma_pagamento);
      setBanco(editingTransaction.banco || '');
      setDataVencimento(editingTransaction.data_vencimento || '');
      setPago(editingTransaction.pago);
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  function resetForm() {
    setDescricao('');
    setValor('');
    setCategoria('');
    setBanco('');
    setDataVencimento('');
    setPago(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao || !valor || !categoria) return;

    setLoading(true);
    try {
      const payload = {
        descricao,
        valor: parseFloat(valor),
        tipo,
        categoria,
        forma_pagamento: formaPagamento,
        banco: banco ? banco : null,
        data_transacao: editingTransaction?.data_transacao || new Date().toISOString(),
        data_vencimento: dataVencimento ? dataVencimento : null,
        pago,
      };

      if (editingTransaction) {
        await updateTransacao(editingTransaction.id, payload);
      } else {
        await createTransacao(payload);
      }

      resetForm();
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao salvar lançamento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          {editingTransaction ? (
            <>
              <Edit3 className="w-5 h-5 text-amber-400" /> Editar Lançamento
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5 text-emerald-400" /> Novo Lançamento
            </>
          )}
        </h2>
        {editingTransaction && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
            <X className="w-4 h-4" /> Cancelar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="text-xs text-slate-400 block mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoTransacao)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="GASTO">Despesa (Gasto)</option>
            <option value="GANHO">Receita (Ganho)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Categoria</label>
          <input
            type="text"
            placeholder="Ex: Alimentação, Moradia..."
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            required
          />
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

        <div>
          <label className="text-xs text-slate-400 block mb-1">Status de Pagamento</label>
          <select
            value={pago ? 'true' : 'false'}
            onChange={(e) => setPago(e.target.value === 'true')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="true">Pago / Recebido</option>
            <option value="false">Pendente</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-sm transition mt-2 disabled:opacity-50"
      >
        {loading ? 'Salvando...' : editingTransaction ? 'Atualizar Transação' : 'Adicionar Transação'}
      </button>
    </form>
  );
}