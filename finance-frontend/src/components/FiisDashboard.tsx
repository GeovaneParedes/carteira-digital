'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Layers, RotateCw, AlertCircle } from 'lucide-react';

export interface FII {
  ticker: string;
  symbol: string;
  nome: string;
  segmento: string;
  cor: string;
  price: number;
  var: number;
  dy: number;
  pvp: number;
  mkt: number;
  vol: number;
  high: number;
  low: number;
  score?: number;
}

const FII_POOL: FII[] = [
  { ticker: 'MXRF11.SA', symbol: 'MXRF11.SA', nome: 'Maxi Renda', segmento: 'Recebíveis', cor: '#f59e0b', price: 10.45, var: 0.38, dy: 0.124, pvp: 1.02, mkt: 2250000000, vol: 4850000, high: 10.95, low: 9.80 },
  { ticker: 'HGLG11.SA', symbol: 'HGLG11.SA', nome: 'CSHG Logística', segmento: 'Logística', cor: '#3b82f6', price: 162.80, var: 0.12, dy: 0.088, pvp: 1.01, mkt: 3780000000, vol: 2100000, high: 168.00, low: 155.20 },
  { ticker: 'XPML11.SA', symbol: 'XPML11.SA', nome: 'XP Malls', segmento: 'Shopping', cor: '#10b981', price: 115.50, var: -0.25, dy: 0.092, pvp: 1.04, mkt: 3200000000, vol: 3400000, high: 120.00, low: 108.50 },
  { ticker: 'KNRI11.SA', symbol: 'KNRI11.SA', nome: 'Kinea Renda Imob.', segmento: 'Híbrido', cor: '#8b5cf6', price: 158.20, var: 0.45, dy: 0.082, pvp: 0.97, mkt: 3900000000, vol: 1850000, high: 164.50, low: 149.00 },
  { ticker: 'BTLG11.SA', symbol: 'BTLG11.SA', nome: 'BTG Logística', segmento: 'Logística', cor: '#6366f1', price: 101.90, var: 0.20, dy: 0.095, pvp: 0.99, mkt: 2800000000, vol: 2900000, high: 105.00, low: 96.80 },
  { ticker: 'RECR11.SA', symbol: 'RECR11.SA', nome: 'REC Recebíveis', segmento: 'Recebíveis', cor: '#ef4444', price: 84.30, var: -0.40, dy: 0.128, pvp: 0.89, mkt: 2100000000, vol: 1500000, high: 92.00, low: 81.00 },
  { ticker: 'VISC11.SA', symbol: 'VISC11.SA', nome: 'Vinci Shopping Centers', segmento: 'Shopping', cor: '#f97316', price: 118.90, var: 0.15, dy: 0.089, pvp: 1.00, mkt: 2500000000, vol: 1950000, high: 124.00, low: 112.00 },
  { ticker: 'CPTS11.SA', symbol: 'CPTS11.SA', nome: 'Capitânia Securities', segmento: 'Recebíveis', cor: '#14b8a6', price: 8.55, var: 0.10, dy: 0.118, pvp: 0.91, mkt: 2700000000, vol: 5100000, high: 9.30, low: 8.10 },
  { ticker: 'BCFF11.SA', symbol: 'BCFF11.SA', nome: 'BTG Fundo de Fundos', segmento: 'FoF', cor: '#06b6d4', price: 8.92, var: -0.10, dy: 0.098, pvp: 0.93, mkt: 1800000000, vol: 2200000, high: 9.60, low: 8.40 },
  { ticker: 'RBVA11.SA', symbol: 'RBVA11.SA', nome: 'Rio Bravo Varejo', segmento: 'Varejo', cor: '#ec4899', price: 108.40, var: 0.30, dy: 0.096, pvp: 1.02, mkt: 1400000000, vol: 1100000, high: 114.00, low: 102.00 },
];

function calcularScore(f: FII): number {
  let s = 0;
  const dy = f.dy || 0;
  s += Math.min((dy * 100) / 15, 1) * 40;
  const pvp = f.pvp || 1;
  s += (pvp <= 1 ? 1 : pvp <= 1.2 ? 0.8 : pvp <= 1.5 ? 0.5 : 0.2) * 30;
  s += Math.min((f.vol || 0) / 5000000, 1) * 20;
  const v = f.var || 0;
  s += (v >= 0 ? 1 : v >= -1 ? 0.7 : 0.3) * 10;
  return Math.round(s);
}

function fmtBRL(v: number | undefined) {
  if (v == null || isNaN(v)) return '—';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtMkt(v: number | undefined) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(0)}M`;
  return fmtBRL(v);
}

interface FiisDashboardProps {
  initialFiis?: FII[];
  onRefreshFiis?: () => void;
}

export function FiisDashboard({ initialFiis = [], onRefreshFiis }: FiisDashboardProps) {
  const [fiis, setFiis] = useState<FII[]>(initialFiis);
  const [selectedFii, setSelectedFii] = useState<FII | null>(initialFiis[0] || null);
  const [loading, setLoading] = useState(initialFiis.length === 0);
  const [lastUpdate, setLastUpdate] = useState<string>(initialFiis.length > 0 ? new Date().toLocaleTimeString('pt-BR') : '');

  useEffect(() => {
    if (initialFiis.length > 0) {
      setFiis(initialFiis);
      setSelectedFii(initialFiis[0] || null);
      setLoading(false);
    } else {
      carregarDados();
    }
  }, [initialFiis]);

  async function carregarDados() {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.9:8010';
      const res = await fetch(`${baseUrl}/fiis`);
      if (!res.ok) throw new Error('Falha ao buscar FIIs do backend');
      const data: FII[] = await res.json();
      
      const top5 = data.slice(0, 5);
      setFiis(top5);
      setSelectedFii(top5[0] || null);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      if (onRefreshFiis) onRefreshFiis();
    } catch (err) {
      console.error('Erro ao carregar FIIs em tempo real:', err);
      // Fallback para não zerar a tela em caso de falha de rede
      const calculados = FII_POOL.map((item) => ({
        ...item,
        score: calcularScore(item),
      }));
      calculados.sort((a, b) => (b.score || 0) - (a.score || 0));
      const top5 = calculados.slice(0, 5);
      setFiis(top5);
      setSelectedFii(top5[0] || null);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR') + ' (offline)');
    } finally {
      setLoading(false);
    }
  }

  const dyMax = fiis.reduce((m, f) => Math.max(m, f.dy || 0), 0);
  const dyFii = fiis.find((f) => f.dy === dyMax);
  const melhor = fiis[0];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Oportunidades em FIIs</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Análise automatizada de Fundos Imobiliários da B3 filtrados por Dividend Yield e Preço Justo (P/VP)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
            Atualizado às {lastUpdate}
          </span>
          <button
            onClick={carregarDados}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Banner Informativo sobre a vantagem do Yield */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-amber-400">Excelente Dividend Yield (DY = 11,80% a.a. até 12,80% a.a.)</p>
          <p className="text-slate-400">
            Paga rendimento mensal <strong className="text-slate-200">100% isento de Imposto de Renda</strong> para pessoa física, com retorno superior à Taxa Selic e à Poupança.
          </p>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">🏆 Melhor Score Geral</p>
          <p className="text-2xl font-black text-amber-400 mt-2">{melhor?.ticker.replace('.SA', '') || '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Score {melhor?.score}/100 no algoritmo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">💰 Maior Yield Anual</p>
          <p className="text-2xl font-black text-emerald-400 mt-2">{(dyMax * 100).toFixed(2)}%</p>
          <p className="text-xs text-slate-500 mt-1">{dyFii?.ticker.replace('.SA', '')} isento de IR</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">📊 Oportunidades Filtradas</p>
          <p className="text-2xl font-black text-blue-400 mt-2">{fiis.length} FIIs</p>
          <p className="text-xs text-slate-500 mt-1">de {FII_POOL.length} ativos monitorados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">🎯 Média P/VP do Top 5</p>
          <p className="text-2xl font-black text-purple-400 mt-2">
            {(fiis.reduce((a, f) => a + f.pvp, 0) / (fiis.length || 1)).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Preço Justo (Ideal ≤ 1.00)</p>
        </div>
      </div>

      {/* Grid Principal: Lista + Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Lista do Ranking */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Top 5 FIIs Selecionados
            </h3>
          </div>

          <div className="space-y-3">
            {fiis.map((fii, index) => {
              const isSelected = selectedFii?.ticker === fii.ticker;
              const isUp = fii.var >= 0;
              return (
                <div
                  key={fii.ticker}
                  onClick={() => setSelectedFii(fii)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-300'
                          : index === 2
                          ? 'bg-amber-700/20 text-amber-600'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {index + 1}º
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{fii.ticker.replace('.SA', '')}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                          {fii.segmento}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{fii.nome}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-100">{fmtBRL(fii.price)}</p>
                    <div className="flex items-center justify-end gap-3 text-xs mt-0.5">
                      <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {isUp ? '▲' : '▼'} {Math.abs(fii.var).toFixed(2)}%
                      </span>
                      <span className="text-emerald-400 font-bold">DY: {(fii.dy * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 2: Detalhamento do FII Selecionado */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" /> Detalhes & Score
          </h3>

          {selectedFii && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-400">{selectedFii.ticker.replace('.SA', '')}</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Score {selectedFii.score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedFii.nome}</p>
                <p className="text-3xl font-extrabold text-slate-100 mt-3">{fmtBRL(selectedFii.price)}</p>
              </div>

              {/* Grid de Estatísticas Rápidas */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Dividend Yield</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">{(selectedFii.dy * 100).toFixed(2)}% a.a.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">P / VP (Desconto)</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">{selectedFii.pvp.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Máxima 52 sem.</span>
                  <span className="font-semibold text-slate-300 mt-0.5 block">{fmtBRL(selectedFii.high)}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Mínima 52 sem.</span>
                  <span className="font-semibold text-slate-300 mt-0.5 block">{fmtBRL(selectedFii.low)}</span>
                </div>
              </div>

              {/* Barras do Score de Vantagem */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score de Vantagem</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Rendimento (DY)</span>
                    <span className="text-emerald-400 font-bold">{(selectedFii.dy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(((selectedFii.dy * 100) / 15) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Preço / VP (Desconto)</span>
                    <span className="text-blue-400 font-bold">{selectedFii.pvp <= 1.0 ? 'Excelente (Abaixo de 1.0)' : 'Justo'}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${selectedFii.pvp <= 1.0 ? 100 : 70}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela Comparativa Completa */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto space-y-4">
        <h3 className="text-sm font-bold text-slate-300">Tabela Comparativa de Rendimentos</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Posição</th>
              <th className="pb-3 font-semibold">FII</th>
              <th className="pb-3 font-semibold">Segmento</th>
              <th className="pb-3 font-semibold">Cotação</th>
              <th className="pb-3 font-semibold">Variação</th>
              <th className="pb-3 font-semibold text-emerald-400">DY Anual</th>
              <th className="pb-3 font-semibold">P / VP</th>
              <th className="pb-3 font-semibold">Valor de Mercado</th>
              <th className="pb-3 font-semibold text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {fiis.map((fii, i) => (
              <tr key={fii.ticker} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 font-bold text-amber-500">{i + 1}º</td>
                <td className="py-3">
                  <span className="font-bold text-slate-200">{fii.ticker.replace('.SA', '')}</span>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                    {fii.segmento}
                  </span>
                </td>
                <td className="py-3 font-bold">{fmtBRL(fii.price)}</td>
                <td className={`py-3 font-semibold ${fii.var >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fii.var >= 0 ? '▲' : '▼'} {Math.abs(fii.var).toFixed(2)}%
                </td>
                <td className="py-3 font-bold text-emerald-400">{(fii.dy * 100).toFixed(2)}%</td>
                <td className="py-3 font-semibold">{fii.pvp.toFixed(2)}</td>
                <td className="py-3 text-slate-400">{fmtMkt(fii.mkt)}</td>
                <td className="py-3 text-right">
                  <span className="font-black text-amber-400">{fii.score}</span>
                  <span className="text-slate-600 text-[10px]">/100</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
