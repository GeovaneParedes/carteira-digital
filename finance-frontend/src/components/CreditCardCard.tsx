'use client';

import React from 'react';
import { CartaoCredito } from '@/lib/types';
import { CreditCard, Edit3, Trash2, TrendingUp, Calendar } from 'lucide-react';

interface CreditCardProps {
  cartao: CartaoCredito;
  onEdit: (cartao: CartaoCredito) => void;
  onDelete: (id: string) => void;
}

export function CreditCardCard({ cartao, onEdit, onDelete }: CreditCardProps) {
  const limiteDisponivel = cartao.limiteTotal - cartao.limiteUsado;
  const percentualUso = Math.min((cartao.limiteUsado / cartao.limiteTotal) * 100, 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 space-y-4 relative overflow-hidden group hover:border-slate-700 transition-all">
      {/* Indicador de cor do cartão no topo */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5" 
        style={{ backgroundColor: cartao.corHex || '#06b6d4' }} 
      />

      <div className="flex justify-between items-start pt-1">
        <div className="flex items-center gap-2.5">
          <div 
            className="p-2 rounded-xl text-slate-950 font-bold"
            style={{ backgroundColor: cartao.corHex || '#06b6d4' }}
          >
            <CreditCard className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">{cartao.nome}</h3>
            {cartao.bandeira && (
              <span className="text-[10px] font-semibold uppercase text-slate-400">
                {cartao.bandeira}
              </span>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(cartao)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Editar Cartão"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cartao.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition-colors"
            title="Excluir Cartão"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Valores de Limite */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Limite Disponível</p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">
            R$ {limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Fatura / Usado</p>
          <p className="text-xl font-bold text-slate-200 mt-0.5">
            R$ {cartao.limiteUsado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Barra de Progresso do Limite */}
      <div className="space-y-1">
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-500 ${percentualUso > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${percentualUso}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{percentualUso.toFixed(0)}% do limite usado</span>
          <span>Limite Total: R$ {cartao.limiteTotal.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Informações Complementares: Saldo em Investimento & Detalhes */}
      {cartao.saldoInvestimento != null && cartao.saldoInvestimento > 0 && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">Investimento Garantia/Reserva:</span>
          </div>
          <span className="text-xs font-bold text-emerald-400">
            R$ {cartao.saldoInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {cartao.detalhes && (
        <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 italic">
          &quot;{cartao.detalhes}&quot;
        </p>
      )}

      {/* Datas de Fechamento e Vencimento */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Fecha dia: <strong className="text-slate-200">{cartao.diaFechamento}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Vence dia: <strong className="text-slate-200">{cartao.diaVencimento}</strong></span>
        </div>
      </div>
    </div>
  );
}