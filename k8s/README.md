# 🚀 Kubernetes Deployment - Carteira Digital

Este diretório contém a especificação dos manifestos Kubernetes para orquestração da solução de Gerenciamento de Contas / Carteira Digital.

## 📁 Estrutura dos Arquivos

1. **`01-config.yaml`**: `Secret` (credenciais do Postgres e chave JWT) + `ConfigMap` (variáveis de ambiente).
2. **`02-postgres.yaml`**: `StatefulSet` + `PersistentVolumeClaim` (PVC) + Headless `Service` para o banco de dados PostgreSQL.
3. **`03-backend.yaml`**: `Deployment` da API FastAPI + `Service` + `HorizontalPodAutoscaler` (HPA de 2 a 5 réplicas).
4. **`04-frontend.yaml`**: `Deployment` da aplicação Next.js + `Service`.
5. **`05-ingress.yaml`**: `Ingress` NGINX para unificação de roteamento.

## 🛠️ Como Aplicar no Cluster (Minikube / Kind / GKE)

```bash
# 1. Aplicar na ordem correta
kubectl apply -f k8s/01-config.yaml
kubectl apply -f k8s/02-postgres.yaml
kubectl apply -f k8s/03-backend.yaml
kubectl apply -f k8s/04-frontend.yaml
kubectl apply -f k8s/05-ingress.yaml

# Ou aplicar o diretório completo de uma vez:
kubectl apply -f k8s/
```

## 🔍 Monitoramento e Verificação

```bash
# Verificar status dos recursos
kubectl get pods,svc,statefulset,hpa,pvc
```
