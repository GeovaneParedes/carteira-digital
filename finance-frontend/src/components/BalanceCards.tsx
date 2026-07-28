import { Balanco } from '../lib/types';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

interface Props {
  balanco: Balanco | null;
}

export function BalanceCards({ balanco }: Props) {
  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card Ganhos */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total de Receitas
          </p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(balanco?.total_ganhos)}
          </h3>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <ArrowUpCircle className="w-7 h-7" />
        </div>
      </div>

      {/* Card Gastos */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total de Despesas
          </p>
          <h3 className="text-2xl font-bold text-rose-400 mt-1">
            {formatCurrency(balanco?.total_gastos)}
          </h3>
        </div>
        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
          <ArrowDownCircle className="w-7 h-7" />
        </div>
      </div>

      {/* Card Saldo */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Saldo Atual
          </p>
          <h3
            className={`text-2xl font-bold mt-1 ${
              (balanco?.saldo_atual ?? 0) >= 0
                ? 'text-blue-400'
                : 'text-rose-500'
            }`}
          >
            {formatCurrency(balanco?.saldo_atual)}
          </h3>
        </div>
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <Wallet className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}