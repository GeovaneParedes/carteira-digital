'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { CartaoCredito } from '@/lib/types';
import { X, CreditCard as CardIcon } from 'lucide-react';

interface ModalProps {
  cartaoParaEditar?: CartaoCredito | null;
  onClose: () => void;
  onSave: (cartao: Omit<CartaoCredito, 'id'> & { id?: string }) => void;
}

export function CardModal({ cartaoParaEditar, onClose, onSave }: ModalProps) {
  const [nome, setNome] = useState('');
  const [bandeira, setBandeira] = useState('Visa');
  const [limiteTotal, setLimiteTotal] = useState('');
  const [limiteUsado, setLimiteUsado] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [saldoInvestimento, setSaldoInvestimento] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [corHex, setCorHex] = useState('#06b6d4');

  useEffect(() => {
    if (cartaoParaEditar) {
      setNome(cartaoParaEditar.nome);
      setBandeira(cartaoParaEditar.bandeira || 'Visa');
      setLimiteTotal(String(cartaoParaEditar.limiteTotal));
      setLimiteUsado(String(cartaoParaEditar.limiteUsado));
      setDiaFechamento(String(cartaoParaEditar.diaFechamento));
      setDiaVencimento(String(cartaoParaEditar.diaVencimento));
      setSaldoInvestimento(cartaoParaEditar.saldoInvestimento ? String(cartaoParaEditar.saldoInvestimento) : '');
      setDetalhes(cartaoParaEditar.detalhes || '');
      setCorHex(cartaoParaEditar.corHex || '#06b6d4');
    }
  }, [cartaoParaEditar]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: cartaoParaEditar?.id,
      nome,
      bandeira,
      limiteTotal: Number(limiteTotal) || 0,
      limiteUsado: Number(limiteUsado) || 0,
      diaFechamento: Number(diaFechamento) || 1,
      diaVencimento: Number(diaVencimento) || 10,
      saldoInvestimento: saldoInvestimento ? Number(saldoInvestimento) : undefined,
      detalhes: detalhes || undefined,
      corHex,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CardIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">
              {cartaoParaEditar ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Nome do Cartão *</span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Nubank Violeta, Itaú Click"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Bandeira</span>
              <select
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
              >
                <option value="Mastercard">Mastercard</option>
                <option value="Visa">Visa</option>
                <option value="Elo">Elo</option>
                <option value="Amex">American Express</option>
                <option value="Outra">Outra</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Limite Total (R$) *</span>
              <input
                type="number"
                step="0.01"
                value={limiteTotal}
                onChange={(e) => setLimiteTotal(e.target.value)}
                placeholder="5000.00"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Fatura / Limite Usado (R$)</span>
              <input
                type="number"
                step="0.01"
                value={limiteUsado}
                onChange={(e) => setLimiteUsado(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Dia de Fechamento da Fatura *</span>
              <input
                type="number"
                min="1"
                max="31"
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(e.target.value)}
                placeholder="5"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Dia de Vencimento da Fatura *</span>
              <input
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                placeholder="12"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Saldo em Investimento Financeiro (R$)</span>
              <input
                type="number"
                step="0.01"
                value={saldoInvestimento}
                onChange={(e) => setSaldoInvestimento(e.target.value)}
                placeholder="Ex: 2500.00 (CDB Limite Crédito)"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-slate-400 font-semibold">Cor de Destaque</span>
              <input
                type="color"
                value={corHex}
                onChange={(e) => setCorHex(e.target.value)}
                className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 p-1 cursor-pointer"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-slate-400 font-semibold">Detalhes / Observações</span>
            <textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Ex: Cartão cashback 1%, usado para contas fixas"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-slate-100 h-20 resize-none"
            />
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
