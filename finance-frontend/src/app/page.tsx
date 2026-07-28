'use client';

import { BalanceCards } from '@/components/BalanceCards';
import { FinanceChart } from '@/components/FinanceChart';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { CreditCardCard } from '@/components/CreditCardCard';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { deleteTransacao, fetchBalanco, fetchTransacoes, loginUser, registerUser } from '@/lib/api';
import { Balanco, Transacao } from '@/lib/types';
import { Lock, RefreshCw, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [balanco, setBalanco] = useState<Balanco | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([fetchBalanco(), fetchTransacoes()]);
      setBalanco(b);
      setTransacoes(t);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os dados. Verifique o login e a API.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (confirm('Deseja realmente apagar esta conta/lançamento?')) {
      try {
        await deleteTransacao(id);
        loadData();
      } catch (err) {
        console.error(err);
        alert('Erro ao apagar transação.');
      }
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      const data = authMode === 'login'
        ? await loginUser(email, senha)
        : await registerUser(nome, email, senha);

      window.localStorage.setItem('finance_token', data.access_token);
      setToken(data.access_token);
      setAuthMode('login');
      setNome('');
      setEmail('');
      setSenha('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar.');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem('finance_token');
    setToken(null);
    setBalanco(null);
    setTransacoes([]);
    setError(null);
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem('finance_token');
    setToken(savedToken);
    setMounted(true);
    if (savedToken) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Carregando painel...</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-slate-800 p-3 text-cyan-300">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Carteira Digital</h1>
              <p className="text-sm text-slate-400">Acesso restrito com usuário e senha.</p>
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${authMode === 'register' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <label className="block">
                <span className="text-sm text-slate-300 mb-1 block">Nome</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white"
                  placeholder="Seu nome"
                  required
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm text-slate-300 mb-1 block">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white"
                placeholder="seu@email.com"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300 mb-1 block">Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white"
                placeholder="Digite sua senha"
                required
                minLength={6}
              />
            </label>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-cyan-500 text-slate-950 font-semibold py-2.5 disabled:opacity-70"
            >
              {authLoading ? 'Autenticando...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Painel Financeiro
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gerencie suas contas, fatura de cartão e balanço geral.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <UserRound className="w-4 h-4" />
              Sair
            </button>
          </div>
        </header>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <BalanceCards balanco={balanco} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CreditCardCard
            nome="Cartão Nubank"
            limiteTotal={3000}
            limiteUsado={Number(balanco?.total_gastos || 0)}
            diaFechamento={5}
            diaVencimento={12}
          />
          <CreditCardCard
            nome="Cartão Itaú"
            limiteTotal={8000}
            limiteUsado={0}
            diaFechamento={20}
            diaVencimento={27}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionForm
            onSuccess={() => {
              setEditingTransaction(null);
              loadData();
            }}
          />
          <FinanceChart balanco={balanco} />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Últimos Lançamentos
          </h2>
          <TransactionList
            transacoes={transacoes}
            onEdit={(t) => setEditingTransaction(t)}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {editingTransaction && (
        <EditTransactionModal
          transacao={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null);
            loadData();
          }}
        />
      )}
    </main>
  );
}