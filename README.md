# 💰 Finance API - Controle Financeiro Enterprise

API REST desenvolvida em Python (FastAPI) e MySQL para gerenciamento avançado de finanças pessoais. Projetada para servir como backend central de aplicações Web, Dashboards e Apps Mobile (Android/iOS).

---

## 🚀 Funcionalidades

- **Registro de Transações Completo**:
  - Ganhos e Gastos
  - Categorização (Alimentação, Moradia, Transporte, etc.)
  - Formas de Pagamento (Cartão de Crédito, Débito, PIX, Boleto, Dinheiro)
  - Vínculo com Instituição Financeira / Banco
  - Data de Vencimento de Fatura/Boleto e Status de Pagamento
- **Relatórios & Balanço**:
  - Total de Ganhos, Total de Gastos e Saldo Atual em tempo real
- **Arquitetura Pronta para Produção**:
  - Totalmente containerizada com Docker e Docker Compose
  - Validação estrita de tipos com Pydantic v2
  - ORM SQLAlchemy com suporte a pool de conexões
  - Suíte de testes unitários e de integração com pytest

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem**: Python 3.11+
- **Framework Web**: FastAPI
- **Servidor ASGI**: Uvicorn
- **Banco de Dados**: MySQL 8.0 / SQLAlchemy ORM
- **Infraestrutura**: Docker & Docker Compose
- **Testes**: Pytest, HTTPX

---

## 📦 Como Executar o Projeto

### Pré-requisitos
- Docker e Docker Compose instalados.
- Make (opcional, mas recomendado).

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd finance_app