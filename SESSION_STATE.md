# SESSION_STATE.md - Sessão de Trabalho

---

## PROJETO 1: Carteira Digital (gereciamento-conta)

### Estado Atual da Aplicação
- **Branch ativa:** `feature/local-dev-setup-and-fixes`
- **Backend FastAPI:** Ativo em `http://localhost:8020` (PID salvo em `.api.pid`)
- **Frontend Next.js:** Ativo em `http://localhost:3000` (PID salvo em `.frontend.pid`)
- **PostgreSQL:** Contêiner Docker `carteira_postgres` na porta `5433`, saudável
- **Testes Backend:** 7/7 passando via `.venv/bin/pytest tests/`
- **Linter:** `ruff check src/` 100% aprovado
- **TypeScript:** `npx tsc --noEmit` sem erros

### O que foi feito nesta sessão
- Identificado conflito de porta `8010` com Nginx do SaaS Empresarial
- Porta da API FastAPI migrada para `8020` (escolha do usuário)
- Makefile atualizado com `setsid nohup` para evitar matar processos de trabalho
- Removidos comandos agressivos `fuser -k` do `make app-down`
- Corrigida ordenação de imports em `src/database.py` (Ruff I001)
- `.gitignore` atualizado com `*.pid`

### Comandos rápidos para retomar
```bash
cd /home/devgege/Documentos/gereciamento-conta
make app-status        # verifica se ainda está rodando
make app-up            # sobe tudo novamente se necessário
make app-down          # para os serviços com segurança
make test              # roda os testes
```

### Próximos passos no Carteira Digital
- Aguardando orientações sobre quais telas/regras de negócio atualizar
- Comitar as alterações da sessão na branch `feature/local-dev-setup-and-fixes`

---

## PROJETO 2: PDV Açougue em C# (IDEIA — AINDA NÃO INICIADO)

### Conceito
Sistema de PDV (Ponto de Venda) para açougues desenvolvido em **C# + WPF** gerando
um único `.exe` auto-contido para Windows 10/11.

### Decisões de Arquitetura Escolhidas
- **UI:** WPF com padrão MVVM (CommunityToolkit.Mvvm)
- **Banco de dados local:** SQLite via Entity Framework Core (sem depender de servidor)
- **Gateway de Pagamento:** Abstração via interface `IGatewayPagamento` (Strategy Pattern)
  - Implementações planejadas: Stone SDK e Mercado Pago REST
- **Impressão de cupom:** System.Drawing + protocolo ESC/POS (impressora térmica)
- **Balança:** `System.IO.Ports` — protocolo Toledo RS-232
- **Distribuição:** `dotnet publish --self-contained true -p:PublishSingleFile=true`
  - Resultado: um único `AcougueSystem.exe` de ~80MB, sem necessidade de instalar .NET

### Estrutura de Projetos da Solution (.sln)
```
AcougueSystem/
├── AcougueSystem.Domain/          # Entidades, Interfaces, Enums
├── AcougueSystem.Application/     # Services, DTOs, Casos de uso
├── AcougueSystem.Infrastructure/  # EF Core, Gateways de Pagamento, Hardware
├── AcougueSystem.WPF/             # Interface gráfica WPF + ViewModels
└── AcougueSystem.Tests/           # Testes unitários e de integração
```

### Entidades Mapeadas
- `Produto` (Nome, CodigoBarras, Preco, VendidoPorPeso, Unidade, Estoque)
- `Venda` (Itens, Total, Desconto, Status, DataHora)
- `ItemVenda` (Produto, Quantidade, PrecoUnitario, SubTotal)
- `Caixa` (Abertura, Fechamento, SaldoInicial, SaldoFinal)

### Formas de Pagamento Previstas
- 💳 Cartão Débito
- 💳 Cartão Crédito (parcelado)
- 📲 Pix
- 💵 Dinheiro

### Fluxo TEF Explicado
```
PDV (WPF) ──► PagamentoService ──► IGatewayPagamento
                                        │
                          ┌─────────────┼──────────────┐
                   StoneGateway   MercadoPagoGateway   (futuros)
                          │
                    API REST HTTPS ──► Adquirente ──► Bandeira ──► Banco
```

### O que falta definir (aguardando usuário)
- [ ] Nome do projeto/empresa
- [ ] Diretório onde criar o projeto no sistema
- [ ] Gateway de pagamento preferido (Stone, Mercado Pago, Cielo, outro?)
- [ ] Precisa de módulo de estoque completo ou básico inicialmente?
- [ ] Emissão de NFC-e (Nota Fiscal) é necessário na primeira versão?
- [ ] Modelo de balança (Toledo, Filizola, outra? Ou pode ser manual?)
- [ ] Impressora térmica tem ou vai comprar? Modelo?
- [ ] Multi-caixa (vários terminais) ou único caixa por enquanto?

### Próximo Passo Quando Retornar
Com os parâmetros acima definidos, será criado:
1. A solution `.sln` completa com todos os projetos
2. `AppDbContext` com migrations para SQLite
3. Tela WPF de caixa funcional (MVVM)
4. Integração com sandbox do gateway escolhido

