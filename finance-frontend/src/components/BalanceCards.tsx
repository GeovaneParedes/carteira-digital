import { Balanco, CartaoCredito } from '../lib/types';
import { ArrowDownCircle, ArrowUpCircle, Wallet, CreditCard, CheckCircle2 } from 'lucide-react';

interface Props {
  balanco: Balanco | null;
  cartoes?: CartaoCredito[];
}

export function BalanceCards({ balanco, cartoes = [] }: Props) {
  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);

  const totalGanhos = Number(balanco?.total_ganhos || 0);
  const despesasPendentes = Number(balanco?.despesas_pendentes || 0);
  const despesasPagas = Number(balanco?.despesas_pagas || 0);
  const saldoAtualConta = Number(balanco?.saldo_atual || 0);

  // Soma a Fatura Mensal exata dos cartões de crédito a pagar neste mês
  const totalFaturasCartoes = cartoes.reduce(
    (acc, c) => acc + Number(c.faturaMensal || 0),
    0
  );

  // Pendências totais ainda por vencer/pagar no mês (Contas pendentes + Cartões)
  const totalPendenciasMes = despesasPendentes + totalFaturasCartoes;

  // Saldo projetado no fim do mês (Dinheiro em conta - o que ainda falta pagar)
  const saldoProjetadoFimMes = saldoAtualConta - totalPendenciasMes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card Ganhos */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total de Receitas
          </p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalGanhos)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Entradas & Salários Registrados</p>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <ArrowUpCircle className="w-7 h-7" />
        </div>
      </div>

      {/* Card Despesas A Pagar (Pendências) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Despesas a Pagar (Pendentes)
          </p>
          <h3 className="text-2xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalPendenciasMes)}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
            <span>A pagar: {formatCurrency(despesasPendentes)}</span>
            <span>•</span>
            <span className="text-cyan-400 flex items-center gap-0.5 font-semibold">
              <CreditCard className="w-3 h-3 inline" /> Cartões: {formatCurrency(totalFaturasCartoes)}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 inline" /> Pagas: {formatCurrency(despesasPagas)}
            </span>
          </div>
        </div>
        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
          <ArrowDownCircle className="w-7 h-7" />
        </div>
      </div>

      {/* Card Saldo em Conta vs Projetado */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Saldo Atual na Conta
          </p>
          <h3
            className={`text-2xl font-bold mt-1 ${
              saldoAtualConta >= 0 ? 'text-blue-400' : 'text-rose-500'
            }`}
          >
            {formatCurrency(saldoAtualConta)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Projetado fim do mês: <span className="font-semibold text-slate-200">{formatCurrency(saldoProjetadoFimMes)}</span>
          </p>
        </div>
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <Wallet className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}