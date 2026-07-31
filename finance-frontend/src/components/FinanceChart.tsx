'use client';

import { Balanco, CartaoCredito } from '../lib/types';
import { AlertTriangle, CheckCircle2, CreditCard, ShieldAlert } from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Props {
  balanco: Balanco | null;
  cartoes: CartaoCredito[];
}

export function FinanceChart({ balanco, cartoes }: Props) {
  const receitaTotal = Number(balanco?.total_ganhos || 0);
  const despesasContas = Number(balanco?.total_gastos || 0);

  // Soma todas as faturas pendentes de cartões de crédito
  const faturasCartoesTotal = cartoes.reduce(
    (acc, c) => acc + Number(c.limiteUsado || 0),
    0
  );

  // Despesa total real comprometida (Contas fixas + Faturas de cartões a fechar)
  const despesaComprometidaTotal = despesasContas + faturasCartoesTotal;

  // Cálculo de estouro de orçamento
  const saldoProjetado = receitaTotal - despesaComprometidaTotal;
  const isEstourado = receitaTotal > 0 && despesaComprometidaTotal > receitaTotal;

  const data = [
    { name: 'Receitas (Entradas)', value: receitaTotal },
    { name: 'Contas & Boletos', value: despesasContas },
    { name: 'Faturas de Cartões (Pendentes)', value: faturasCartoesTotal },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  const fmtBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 text-slate-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          Distribuição & Saúde Financeira
        </h2>

        {/* Alerta de Estouro de Orçamento / Compatibilidade de Salário */}
        {isEstourado ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/60 px-3 py-1.5 rounded-full border border-rose-800 animate-pulse">
            <AlertTriangle className="w-4 h-4" /> Orçamento Estourado!
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800">
            <CheckCircle2 className="w-4 h-4" /> Salário Compatível
          </span>
        )}
      </div>

      {/* Gráfico Rosca Composto */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value: unknown) => fmtBRL(Number(value || 0))}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Alerta Visual de Compatibilidade Salarial */}
      {isEstourado && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Atenção: As Faturas dos Cartões + Contas Estouraram a Receita!</span>
          </div>
          <p className="text-xs text-slate-300">
            Seu salário cadastrado é de <strong>{fmtBRL(receitaTotal)}</strong>, mas as contas fixas (<strong>{fmtBRL(despesasContas)}</strong>) somadas às faturas de cartões a fechar (<strong>{fmtBRL(faturasCartoesTotal)}</strong>) totalizam <strong>{fmtBRL(despesaComprometidaTotal)}</strong>.
          </p>
          <div className="text-xs font-black text-rose-400 pt-1">
            Déficit Projetado: -{fmtBRL(Math.abs(saldoProjetado))}
          </div>
        </div>
      )}

      {/* Resumo de Faturas a Fechar por Cartão */}
      <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
        <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[11px]">
          Faturas a Fechar no Mês (Cartões):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cartoes.map((c) => {
            const fatura = Number(c.limiteUsado || 0);
            return (
              <div key={c.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 font-medium truncate">
                  <span className="truncate">{c.nome}</span>
                  <CreditCard className="w-3 h-3 shrink-0 text-slate-500" />
                </div>
                <div className="font-bold text-amber-400 text-xs mt-0.5">{fmtBRL(fatura)}</div>
                <div className="text-[10px] text-slate-500">Vence dia {c.diaVencimento}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}