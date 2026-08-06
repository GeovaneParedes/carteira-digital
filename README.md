# 💳 Carteira Digital - Enterprise Financial & FIIs Dashboard

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Kubernetes Ready](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Multi--Container-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![JWT Secured](https://img.shields.io/badge/Auth-JWT%20Tokens-red?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Sistema Full-Stack Enterprise multi-inquilino (*multi-tenant*) desenvolvido em **Next.js 14**, **FastAPI (Python)**, **PostgreSQL** e orquestrado via **Kubernetes (K8s)** para gestão de finanças pessoais, cartões de crédito e análise automatizada de **Fundos de Investimento Imobiliário (FIIs)** em tempo real da B3.

---

## 📌 Arquitetura & Orquestração K8s

O projeto é estruturado em microsserviços containerizados com resiliência de dados e suporte a auto-escalonamento via Kubernetes:

```mermaid
graph TD
    User([🌐 Usuário / Browser]) --> Ingress[☸️ K8s Ingress Controller]
    Ingress -- / --> Frontend[💻 Next.js Frontend - ClusterIP:3000]
    Ingress -- /api --> Backend[⚡ FastAPI Backend - ClusterIP:8000]
    
    Backend --> HPA[📈 HPA Auto-scaler 2~5 Pods]
    Backend --> DB[(🐘 PostgreSQL 16 - StatefulSet + PVC)]
```

---

## 🚀 Novas Atualizações e Recursos de Regra de Negócio

### 🆕 Isolamento Estrito de Novas Contas & Modelos Padrão
- **Contas Novas Isolas**: Corrigida a lógica de registro de usuários. Agora, quando um novo usuário realiza cadastro (ex: teste para um novo membro familiar), ele inicia com ambiente individual e **2 cartões de modelo limpos** ("*Cartão Principal Modelo*" e "*Cartão Secundário Modelo*"), com limites zerados para que possa preencher com suas informações próprias.
- **Prevenção de Vazamento de Dados**: Os dados e lançamentos de outros usuários cadastrados anteriormente são mantidos sob **isolamento estrito multi-tenant (Multi-User ID)** via tokens JWT.

---

## 🛠️ Tecnologias e Dependências

| Categoria | Tecnologias Utilizadas |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, Recharts, Lucide Icons |
| **Backend API** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2 |
| **Banco de Dados & Dados** | PostgreSQL 16 com volume persistente (StatefulSet no K8s) |
| **Segurança & Auth** | Passlib (PBKDF2 HMAC SHA-256), JWT Tokens, CORS Middleware |
| **Orquestração** | Kubernetes Manifests (StatefulSet, Deployment, HPA, Ingress, Secrets) |

---

## 🏗️ Como Executar a Aplicação

### 1. Via Docker Compose (Ambiente de Desenvolvimento)

```bash
# Iniciar o banco PostgreSQL, Backend e Frontend unificados
docker-compose up -d --build

# Acessar a aplicação:
# Frontend: http://localhost:3005
# Backend API: http://localhost:8010
```

### 2. Via Kubernetes (Cluster Local ou Nuvem)

```bash
# Aplicar todos os recursos K8s em ordem
kubectl apply -f k8s/
```

---

## 📄 Licença

Projeto desenvolvido sob a licença [MIT](LICENSE).
