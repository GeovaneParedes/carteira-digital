'use client';

interface CreditCardProps {
  nome: string;
  limiteTotal: number;
  limiteUsado: number;
  diaFechamento: number;
  diaVencimento: number;
}

export function CreditCardCard({
  nome,
  limiteTotal,
  limiteUsado,
  diaFechamento,
  diaVencimento
}: CreditCardProps) {
  const limiteDisponivel = limiteTotal - limiteUsado;
  const percentualUso = Math.min((limiteUsado / limiteTotal) * 100, 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 space-y-4">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-base">{nome}</span>
        <span className="text-xs bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-slate-400">
          Cartão de Crédito
        </span>
      </div>

      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Limite Disponível</p>
        <p className="text-2xl font-bold text-emerald-400 mt-1">
          R$ {limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Barra de Limite */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
        <div 
          className={`h-full transition-all duration-300 ${percentualUso > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${percentualUso}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div>
          <span className="block text-slate-500">Fecha dia:</span>
          <span className="font-semibold text-slate-200">{diaFechamento}</span>
        </div>
        <div>
          <span className="block text-slate-500">Vence dia:</span>
          <span className="font-semibold text-slate-200">{diaVencimento}</span>
        </div>
      </div>
    </div>
  );
}