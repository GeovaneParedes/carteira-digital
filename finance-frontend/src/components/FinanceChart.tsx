'use client';

import { Balanco, CartaoCredito } from '../lib/types';
import { AlertTriangle, CheckCircle2, CreditCard, ShieldAlert, Receipt } from 'lucide-react';
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

  // Soma a Fatura Mensal exata a pagar de cada cartão
  const faturasCartoesMesTotal = cartoes.reduce(
    (acc, c) => acc + Number(c.faturaMensal || 0),
    0
  );

  // Soma do montante total comprometido em compras parceladas futuras
  const montanteParceladosTotal = cartoes.reduce(
    (acc, c) => acc + Number(c.limiteUsado || 0),
    0
  );

  // Despesa total real do mês (Contas fixas + Faturas mensais dos cartões)
  const despesaComprometidaMes = despesasContas + faturasCartoesMesTotal;

  // Cálculo de compatibilidade de salário no mês
  const saldoProjetadoMes = receitaTotal - despesaComprometidaMes;
  const isEstourado = receitaTotal > 0 && despesaComprometidaMes > receitaTotal;

  const data = [
    { name: 'Receitas (Salário)', value: receitaTotal },
    { name: 'Contas & Boletos', value: despesasContas },
    { name: 'Faturas de Cartões (Mês)', value: faturasCartoesMesTotal },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  const fmtBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Distribuição & Saúde Financeira
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Soma das faturas mensais dos cartões vs Salário
          </p>
        </div>

        {/* Alerta de Estouro de Orçamento / Compatibilidade do Salário */}
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
      <div className="h-52 w-full">
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

      {/* Alerta Visual de Compatibilidade Salarial no Mês */}
      {isEstourado && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Atenção: As Faturas Mensais + Contas Estouraram o Salário!</span>
          </div>
          <p className="text-xs text-slate-300">
            Seu salário cadastrado é de <strong>{fmtBRL(receitaTotal)}</strong>, mas as contas fixas (<strong>{fmtBRL(despesasContas)}</strong>) somadas às faturas de cartões deste mês (<strong>{fmtBRL(faturasCartoesMesTotal)}</strong>) totalizam <strong>{fmtBRL(despesaComprometidaMes)}</strong>.
          </p>
          <div className="text-xs font-black text-rose-400 pt-1">
            Déficit no Mês: -{fmtBRL(Math.abs(saldoProjetadoMes))}
          </div>
        </div>
      )}

      {/* Resumo de Faturas Mensais vs Montante Parcelado */}
      <div className="pt-2 border-t border-slate-800 space-y-3.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-400" /> Faturas a Pagar neste Mês:
          </span>
          <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Total Mês: {fmtBRL(faturasCartoesMesTotal)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cartoes.map((c) => {
            const faturaMes = Number(c.faturaMensal || 0);
            return (
              <div key={c.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-bold truncate">
                  <span className="truncate">{c.nome}</span>
                  <CreditCard className="w-3 h-3 shrink-0 text-slate-500" />
                </div>
                <div className="font-extrabold text-amber-400 text-xs">{fmtBRL(faturaMes)}</div>
                <div className="text-[10px] text-slate-500">Vence dia {c.diaVencimento}</div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
          <span>Montante Total Comprometido (Parcelados a Vencer Futuros):</span>
          <strong className="text-slate-200">{fmtBRL(montanteParceladosTotal)}</strong>
        </div>
      </div>
    </div>
  );
}