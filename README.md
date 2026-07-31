# 💰 Carteira Digital - Management & FIIs Dashboard Enterprise

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Multi--stage-blue.svg)](https://www.docker.com/)
[![JWT Auth](https://img.shields.io/badge/JWT-Protected-red.svg)](https://jwt.io/)

Aplicação Full-Stack Enterprise desenvolvida em **Next.js 14**, **FastAPI (Python)** e **SQLite/PostgreSQL** para gestão avançada de finanças pessoais, cartões de crédito e análise automatizada de **Fundos de Investimento Imobiliário (FIIs)** da B3.

---

## 🚀 Funcionalidades Principais

- **📊 Análise Automática de FIIs (B3/Bovespa)**:
  - Algoritmo de **Score de Vantagem (0 a 100)** que filtra os melhores fundos imobiliários.
  - Análise em tempo real de **Dividend Yield (DY %)**, **Preço sobre Valor Patrimonial (P/VP)** e **Liquidez/Volume**.
  - Destaque para os maiores Yields isentos de Imposto de Renda (**RECR11, MXRF11, CPTS11**).
- **💳 Gestão de Lançamentos & Cartões**:
  - Cadastro de Ganhos, Gastos e Categorias.
  - Acompanhamento de faturas de Cartão de Crédito com datas de fechamento e vencimento.
- **🔐 Autenticação & Segurança**:
  - Autenticação com senhas criptografadas e tokens **JWT (JSON Web Token)**.
  - Isolamento de dados estrito por usuário.
- **🎨 Frontend de Alta Performance**:
  - Interface Dark Mode desenvolvida em Next.js 14, TailwindCSS e Lucide Icons.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Recharts, Lucide Icons
- **Backend API**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2
- **Segurança**: Passlib (Bcrypt), PyJWT
- **Infraestrutura**: Docker & Docker Compose

---

## 📦 Como Executar o Projeto

### 1. Backend (FastAPI)
```bash
cd gerenciamento-conta
source .venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8010 --reload
```

### 2. Frontend (Next.js)
```bash
cd finance-frontend
npm run dev
```
Acesse em: `http://localhost:3000`
