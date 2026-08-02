import { Balanco, CartaoCredito } from '../lib/types';
import { ArrowDownCircle, ArrowUpCircle, Wallet, CreditCard } from 'lucide-react';

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
  const despesasContas = Number(balanco?.total_gastos || 0);

  // Soma a Fatura Mensal exata dos cartões de crédito a pagar neste mês
  const totalFaturasCartoes = cartoes.reduce(
    (acc, c) => acc + Number(c.faturaMensal || 0),
    0
  );

  // Despesa total real do mês = Contas + Faturas de Cartão
  const despesaTotalReal = despesasContas + totalFaturasCartoes;

  // Saldo real que realmente sobra no bolso no fim do mês
  const saldoReal = totalGanhos - despesaTotalReal;

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
          <p className="text-[11px] text-slate-500 mt-1">Salário & Ganhos Entrados</p>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <ArrowUpCircle className="w-7 h-7" />
        </div>
      </div>

      {/* Card Gastos (Contas + Faturas de Cartão) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total de Despesas (Mês)
          </p>
          <h3 className="text-2xl font-bold text-rose-400 mt-1">
            {formatCurrency(despesaTotalReal)}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span>Contas: {formatCurrency(despesasContas)}</span>
            <span>•</span>
            <span className="text-amber-400 flex items-center gap-0.5 font-semibold">
              <CreditCard className="w-3 h-3 inline" /> Cartões: {formatCurrency(totalFaturasCartoes)}
            </span>
          </div>
        </div>
        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
          <ArrowDownCircle className="w-7 h-7" />
        </div>
      </div>

      {/* Card Saldo Real Disponível */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Saldo Real Disponível
          </p>
          <h3
            className={`text-2xl font-bold mt-1 ${
              saldoReal >= 0 ? 'text-blue-400' : 'text-rose-500'
            }`}
          >
            {formatCurrency(saldoReal)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Livre após pagar contas + cartões</p>
        </div>
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <Wallet className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}