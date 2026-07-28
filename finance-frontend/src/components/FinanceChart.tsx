'use client';

import { Balanco } from '../lib/types';
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
}

export function FinanceChart({ balanco }: Props) {
  const data = [
    { name: 'Receitas', value: Number(balanco?.total_ganhos || 0) },
    { name: 'Despesas', value: Number(balanco?.total_gastos || 0) },
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        Distribuição Financeira
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
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
              }}
              formatter={(value: unknown) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(value || 0))
              }
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}