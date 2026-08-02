'use client';

import { BalanceCards } from '@/components/BalanceCards';
import { FinanceChart } from '@/components/FinanceChart';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { CreditCardCard } from '@/components/CreditCardCard';
import { CardModal } from '@/components/CardModal';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { FiisDashboard } from '@/components/FiisDashboard';
import { Balanco, Transacao, CartaoCredito } from '@/lib/types';
import { fetchBalanco, fetchTransacoes, deleteTransacao, loginUser, registerUser, solicitarCodigoRecuperacao, redefinirSenhaComCodigo, fetchCartoes, createCartao, updateCartao, deleteCartao } from '@/lib/api';
import { Lock, RefreshCw, UserRound, LayoutDashboard, TrendingUp, Plus, CreditCard as CardIcon, Eye, EyeOff, KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const INITIAL_CARTOES: CartaoCredito[] = [
  {
    id: '1',
    nome: 'Cartão Nubank',
    bandeira: 'Mastercard',
    limiteTotal: 1200,
    limiteUsado: 821.04,
    faturaMensal: 250.00,
    diaFechamento: 19,
    diaVencimento: 26,
    saldoInvestimento: 29.66,
    detalhes: 'Cartão principal para uso diário e cashback',
    corHex: '#8b5cf6',
  },
  {
    id: '2',
    nome: 'Cartão Inter',
    bandeira: 'Mastercard',
    limiteTotal: 8840,
    limiteUsado: 1673.55,
    faturaMensal: 450.00,
    diaFechamento: 19,
    diaVencimento: 25,
    saldoInvestimento: 0,
    detalhes: 'Cartão reserva para compras parceladas',
    corHex: '#f97316',
  },
  {
    id: '3',
    nome: 'PicPay',
    bandeira: 'Mastercard',
    limiteTotal: 4870,
    limiteUsado: 434.00,
    faturaMensal: 434.00,
    diaFechamento: 7,
    diaVencimento: 15,
    saldoInvestimento: 0,
    corHex: '#10b981',
  },
  {
    id: '4',
    nome: 'Next',
    bandeira: 'Visa',
    limiteTotal: 770,
    limiteUsado: 128.33,
    faturaMensal: 128.33,
    diaFechamento: 14,
    diaVencimento: 25,
    saldoInvestimento: 0,
    corHex: '#06b6d4',
  },
  {
    id: '5',
    nome: 'Mercado Pago',
    bandeira: 'Visa',
    limiteTotal: 8300,
    limiteUsado: 1904.51,
    faturaMensal: 380.00,
    diaFechamento: 9,
    diaVencimento: 15,
    saldoInvestimento: 0,
    corHex: '#3b82f6',
  },
  {
    id: '6',
    nome: 'Nubank Empresarial',
    bandeira: 'Mastercard',
    limiteTotal: 5750,
    limiteUsado: 2579.85,
    faturaMensal: 520.00,
    diaFechamento: 19,
    diaVencimento: 26,
    saldoInvestimento: 0,
    corHex: '#a855f7',
  },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'fiis'>('geral');
  const [balanco, setBalanco] = useState<Balanco | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>(INITIAL_CARTOES);
  const [editingCard, setEditingCard] = useState<CartaoCredito | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'esqueci' | 'codigo'>('login');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados dos formulários de Auth e Recuperação
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  async function handleSaveCard(cardData: Omit<CartaoCredito, 'id'> & { id?: string }) {
    try {
      if (cardData.id) {
        await updateCartao(cardData.id, cardData);
      } else {
        await createCartao(cardData);
      }
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar cartão de crédito.');
    }
  }

  async function handleDeleteCard(id: string) {
    if (confirm('Deseja realmente remover este cartão de crédito?')) {
      try {
        await deleteCartao(id);
        await loadData();
      } catch (err) {
        console.error(err);
        alert('Erro ao apagar cartão de crédito.');
      }
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [b, t, c] = await Promise.all([fetchBalanco(), fetchTransacoes(), fetchCartoes()]);
      setBalanco(b);
      setTransacoes(t);
      setCartoes(c);
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
    setSuccessMessage(null);

    try {
      if (authMode === 'esqueci') {
        const res = await solicitarCodigoRecuperacao(email);
        setSuccessMessage(res.message);
        setAuthMode('codigo');
      } else if (authMode === 'codigo') {
        const data = await redefinirSenhaComCodigo(email, codigo, novaSenha);
        window.localStorage.setItem('finance_token', data.access_token);
        setToken(data.access_token);
        setSuccessMessage('Senha redefinida com sucesso!');
        await loadData();
      } else {
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no processamento.');
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
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-800 p-3 text-cyan-300">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Carteira Digital</h1>
              <p className="text-sm text-slate-400">Acesso seguro com autenticação.</p>
            </div>
          </div>

          {/* Seleção de Modo: Login / Registro */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(null); setSuccessMessage(null); }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${authMode === 'register' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
              >
                Registrar
              </button>
            </div>
          )}

          {/* Botão voltar para o login nas telas de recuperação */}
          {(authMode === 'esqueci' || authMode === 'codigo') && (
            <button
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o Login
            </button>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <label className="block">
                <span className="text-sm text-slate-300 mb-1 block font-medium">Nome Completo</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white placeholder-slate-500"
                  placeholder="Seu nome"
                  required
                />
              </label>
            )}

            {(authMode === 'login' || authMode === 'register' || authMode === 'esqueci' || authMode === 'codigo') && (
              <label className="block">
                <span className="text-sm text-slate-300 mb-1 block font-medium">E-mail Cadastrado</span>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white placeholder-slate-500 pr-10"
                    placeholder="seu@email.com"
                    required
                    disabled={authMode === 'codigo'}
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
              </label>
            )}

            {(authMode === 'login' || authMode === 'register') && (
              <label className="block">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-300 font-medium">Senha</span>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('esqueci'); setError(null); setSuccessMessage(null); }}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white placeholder-slate-500 pr-10"
                    placeholder="Digite sua senha"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
            )}

            {/* Tela de Inserir Código de 6 Dígitos e Nova Senha */}
            {authMode === 'codigo' && (
              <>
                <label className="block">
                  <span className="text-sm text-slate-300 mb-1 block font-medium">Código de 6 Dígitos (Recebido por E-mail)</span>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-amber-400 font-black tracking-widest text-center text-lg"
                      placeholder="123456"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300 mb-1 block font-medium">Nova Senha</span>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white placeholder-slate-500 pr-10"
                      placeholder="Digite a nova senha"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>
              </>
            )}

            {error && <p className="text-xs font-semibold text-rose-400 bg-rose-950/50 p-2.5 rounded-xl border border-rose-800">{error}</p>}
            {successMessage && <p className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800">{successMessage}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 transition-all disabled:opacity-70"
            >
              {authLoading
                ? 'Processando...'
                : authMode === 'login'
                ? 'Entrar'
                : authMode === 'register'
                ? 'Criar conta'
                : authMode === 'esqueci'
                ? 'Enviar Código por E-mail 📧'
                : 'Redefinir Senha & Entrar'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const cartoesComFatura = [...cartoes].sort((a, b) => a.diaFechamento - b.diaFechamento);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Carteira Digital
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gerencie suas contas, cartões de crédito e investimento em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Navegação entre Abas */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('geral')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'geral' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('fiis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'fiis' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Análise FIIs
              </button>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-medium transition"
            >
              <UserRound className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </header>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        {/* Conteúdo Dinâmico por Aba */}
        {activeTab === 'geral' ? (
          <>
            <BalanceCards balanco={balanco} cartoes={cartoesComFatura} />

            {/* Gestão de Cartões de Crédito */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <CardIcon className="w-5 h-5 text-cyan-400" /> Cartões de Crédito
                </h2>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setIsCardModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" /> Adicionar Cartão
                </button>
              </div>

              {cartoesComFatura.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cartoesComFatura.map((cartao) => (
                    <CreditCardCard
                      key={cartao.id}
                      cartao={cartao}
                      onEdit={(c) => {
                        setEditingCard(c);
                        setIsCardModalOpen(true);
                      }}
                      onDelete={handleDeleteCard}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
                  Nenhum cartão cadastrado. Clique no botão acima para adicionar seu primeiro cartão!
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionForm
                onSuccess={() => {
                  setEditingTransaction(null);
                  loadData();
                }}
              />
              <FinanceChart balanco={balanco} cartoes={cartoesComFatura} />
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
          </>
        ) : (
          <FiisDashboard />
        )}
      </div>

      {/* Modal de Adicionar/Editar Cartão */}
      {isCardModalOpen && (
        <CardModal
          cartaoParaEditar={editingCard}
          onClose={() => setIsCardModalOpen(false)}
          onSave={handleSaveCard}
        />
      )}

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