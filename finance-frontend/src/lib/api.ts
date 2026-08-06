import { Balanco, Transacao, CartaoCredito } from './types';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:8010`;
  }
  return 'http://localhost:8010';
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('finance_token');
}

function buildHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export async function loginUser(email: string, senha: string): Promise<{ access_token: string; token_type: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, senha }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Credenciais inválidas. Verifique seu e-mail e senha.');
  }
  return res.json();
}

export async function registerUser(nome: string, email: string, senha: string): Promise<{ access_token: string; token_type: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/registrar`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ nome, email, senha }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Não foi possível registrar o usuário.');
  }
  return res.json();
}

export async function solicitarCodigoRecuperacao(email: string): Promise<{ message: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/esqueci-senha`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Erro ao enviar código de verificação.');
  }
  return res.json();
}

export async function redefinirSenhaComCodigo(email: string, codigo: string, nova_senha: string): Promise<{ access_token: string; token_type: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/redefinir-senha`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, codigo, nova_senha }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Código de verificação inválido ou expirado.');
  }
  return res.json();
}

// --- INTEGRAÇÃO PERMANENTE DE CARTÕES NO BANCO DE DADOS ---

export async function fetchCartoes(): Promise<CartaoCredito[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/cartoes`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error('Falha ao carregar cartões de crédito.');
  const data = await res.json();
  return data.map((c: Record<string, unknown>) => ({
    id: String(c.id),
    nome: String(c.nome),
    bandeira: c.bandeira ? String(c.bandeira) : undefined,
    limiteTotal: Number(c.limite_total || c.limiteTotal || 0),
    limiteUsado: Number(c.limite_usado || c.limiteUsado || 0),
    faturaMensal: Number(c.fatura_mensal || c.faturaMensal || 0),
    diaFechamento: Number(c.dia_fechamento || c.diaFechamento || 1),
    diaVencimento: Number(c.dia_vencimento || c.diaVencimento || 10),
    saldoInvestimento: (c.saldo_investimento || c.saldoInvestimento) ? Number(c.saldo_investimento || c.saldoInvestimento) : undefined,
    detalhes: c.detalhes ? String(c.detalhes) : undefined,
    corHex: String(c.cor_hex || c.corHex || '#06b6d4'),
  }));
}

export async function createCartao(data: Omit<CartaoCredito, 'id'>): Promise<CartaoCredito> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/cartoes`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao cadastrar cartão.');
  const c = await res.json();
  return {
    id: String(c.id),
    nome: String(c.nome),
    bandeira: c.bandeira ? String(c.bandeira) : undefined,
    limiteTotal: Number(c.limite_total || c.limiteTotal || 0),
    limiteUsado: Number(c.limite_usado || c.limiteUsado || 0),
    faturaMensal: Number(c.fatura_mensal || c.faturaMensal || 0),
    diaFechamento: Number(c.dia_fechamento || c.diaFechamento || 1),
    diaVencimento: Number(c.dia_vencimento || c.diaVencimento || 10),
    saldoInvestimento: (c.saldo_investimento || c.saldoInvestimento) ? Number(c.saldo_investimento || c.saldoInvestimento) : undefined,
    detalhes: c.detalhes ? String(c.detalhes) : undefined,
    corHex: String(c.cor_hex || c.corHex || '#06b6d4'),
  };
}

export async function updateCartao(id: string, data: Omit<CartaoCredito, 'id'>): Promise<CartaoCredito> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/cartoes/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar cartão.');
  const c = await res.json();
  return {
    id: String(c.id),
    nome: String(c.nome),
    bandeira: c.bandeira ? String(c.bandeira) : undefined,
    limiteTotal: Number(c.limite_total || c.limiteTotal || 0),
    limiteUsado: Number(c.limite_usado || c.limiteUsado || 0),
    faturaMensal: Number(c.fatura_mensal || c.faturaMensal || 0),
    diaFechamento: Number(c.dia_fechamento || c.diaFechamento || 1),
    diaVencimento: Number(c.dia_vencimento || c.diaVencimento || 10),
    saldoInvestimento: (c.saldo_investimento || c.saldoInvestimento) ? Number(c.saldo_investimento || c.saldoInvestimento) : undefined,
    detalhes: c.detalhes ? String(c.detalhes) : undefined,
    corHex: String(c.cor_hex || c.corHex || '#06b6d4'),
  };
}

export async function deleteCartao(id: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/cartoes/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao excluir cartão.');
}

// --- TRANSAÇÕES ---

export async function fetchBalanco(): Promise<Balanco> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/transacoes/balanco`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error('Falha ao carregar balanço.');
  const data = await res.json();
  return {
    total_ganhos: Number(data.total_ganhos || 0),
    total_gastos: Number(data.total_gastos || 0),
    saldo_atual: Number(data.saldo_atual || 0),
  };
}

export async function fetchTransacoes(): Promise<Transacao[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/transacoes`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error('Falha ao carregar transações.');
  const data = await res.json();
  return data.map((item: Transacao) => ({
    ...item,
    valor: Number(item.valor),
  }));
}

export async function createTransacao(data: Omit<Transacao, 'id'>): Promise<Transacao> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/transacoes`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar transação.');
  return res.json();
}

export async function updateTransacao(id: number, data: Omit<Transacao, 'id'>): Promise<Transacao> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/transacoes/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar transação.');
  return res.json();
}

export async function deleteTransacao(id: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/transacoes/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao apagar transação.');
}