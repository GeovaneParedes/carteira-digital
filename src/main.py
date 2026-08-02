import json
import logging
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from src.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from src.database import Base, engine, get_db
from src.email_service import enviar_email_codigo_recuperacao
from src.models import UsuarioModel
from src.repository import CartaoRepository, TransacaoRepository
from src.schemas import (
    BalancoResponse,
    CartaoCreditoCreate,
    CartaoCreditoResponse,
    EsqueciSenhaRequest,
    FIISchema,
    RedefinirSenhaRequest,
    TokenResponse,
    TransacaoCreate,
    TransacaoResponse,
    TransacaoUpdate,
    UsuarioCreate,
    UsuarioLogin,
)

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Carteira Digital API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/registrar", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def registrar(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra um novo usuário com senha hashada."""
    usuario_existente = db.query(UsuarioModel).filter(UsuarioModel.email == usuario_in.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já cadastrado.",
        )

    novo_usuario = UsuarioModel(
        nome=usuario_in.nome,
        email=usuario_in.email,
        senha_hash=hash_password(usuario_in.senha),
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    # Injeta os 6 cartões padrão para o novo usuário no Banco de Dados
    cartao_repo = CartaoRepository(db, novo_usuario.id)
    cartao_repo.inicializar_cartoes_padrao()

    token = create_access_token(novo_usuario.email)
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def login(usuario_in: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica o usuário e gera o JWT Token."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == usuario_in.email).first()
    if not usuario or not verify_password(usuario_in.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token(usuario.email)
    return TokenResponse(access_token=token)


@app.post("/auth/esqueci-senha")
def esqueci_senha(req: EsqueciSenhaRequest, db: Session = Depends(get_db)):
    """Gera código de 6 dígitos e envia por e-mail via Gmail SMTP."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == req.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="E-mail não encontrado.")

    import random
    codigo = f"{random.randint(100000, 999999)}"
    usuario.codigo_recuperacao = codigo
    usuario.codigo_expiracao = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    try:
        enviar_email_codigo_recuperacao(usuario.email, codigo)
    except (OSError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar e-mail: {e!s}")

    return {"message": "Código de recuperação enviado para o e-mail."}


@app.post("/auth/redefinir-senha", response_model=TokenResponse)
def redefinir_senha(req: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    """Valida o código de 6 dígitos e redefine a senha do usuário."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == req.email).first()
    if not usuario or not usuario.codigo_recuperacao:
        raise HTTPException(status_code=400, detail="Solicitação inválida.")

    if usuario.codigo_recuperacao != req.codigo:
        raise HTTPException(status_code=400, detail="Código de verificação incorreto.")

    expiracao = usuario.codigo_expiracao
    if expiracao:
        if expiracao.tzinfo is None:
            expiracao = expiracao.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiracao:
            raise HTTPException(status_code=400, detail="Código expirado.")

    usuario.senha_hash = hash_password(req.nova_senha)
    usuario.codigo_recuperacao = None
    usuario.codigo_expiracao = None
    db.commit()

    token = create_access_token(usuario.email)
    return TokenResponse(access_token=token)


# --- ROTAS DE CARTÕES DE CRÉDITO (PERMANÊNCIA MULTI-DISPOSITIVO EM DB) ---

@app.get("/cartoes", response_model=list[CartaoCreditoResponse])
def listar_cartoes(
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Lista todos os cartões cadastrados pelo usuário autenticado no Banco PostgreSQL."""
    repo = CartaoRepository(db, usuario_id=usuario_atual.id)
    cartoes = repo.listar_todos()
    if not cartoes:
        cartoes = repo.inicializar_cartoes_padrao()
    return cartoes


@app.post("/cartoes", response_model=CartaoCreditoResponse, status_code=status.HTTP_201_CREATED)
def criar_cartao(
    cartao_in: CartaoCreditoCreate,
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Cria um novo cartão de crédito para o usuário no Banco de Dados."""
    repo = CartaoRepository(db, usuario_id=usuario_atual.id)
    return repo.criar(cartao_in)


@app.put("/cartoes/{cartao_id}", response_model=CartaoCreditoResponse)
def atualizar_cartao(
    cartao_id: int,
    dados: CartaoCreditoCreate,
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Atualiza as faturas e limites do cartão no Banco de Dados."""
    repo = CartaoRepository(db, usuario_id=usuario_atual.id)
    atualizado = repo.atualizar(cartao_id, dados)
    if not atualizado:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    return atualizado


@app.delete("/cartoes/{cartao_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_cartao(
    cartao_id: int,
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Remove um cartão de crédito do banco de dados."""
    repo = CartaoRepository(db, usuario_id=usuario_atual.id)
    if not repo.deletar(cartao_id):
        raise HTTPException(status_code=404, detail="Cartão não encontrado")


# --- ROTAS DE TRANSAÇÕES ---

@app.get("/transacoes", response_model=list[TransacaoResponse])
def listar_transacoes(
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Lista todas as transações do usuário autenticado."""
    repo = TransacaoRepository(db, usuario_id=usuario_atual.id)
    return repo.listar_todas()


@app.post("/transacoes", response_model=TransacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_transacao(
    transacao: TransacaoCreate,
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Cria uma nova transação associada ao usuário autenticado."""
    repo = TransacaoRepository(db, usuario_id=usuario_atual.id)
    return repo.criar(transacao)


@app.get("/transacoes/balanco", response_model=BalancoResponse)
def obter_balanco(
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Obtém os somatórios de ganhos, gastos e saldo do usuário."""
    repo = TransacaoRepository(db, usuario_id=usuario_atual.id)
    return repo.calcular_balanco()


@app.put("/transacoes/{transacao_id}", response_model=TransacaoResponse)
def atualizar_transacao(
    transacao_id: int,
    dados: TransacaoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Atualiza parcialmente uma transação do usuário autenticado."""
    repo = TransacaoRepository(db, usuario_id=usuario_atual.id)
    transacao_atualizada = repo.atualizar(transacao_id, dados)
    if not transacao_atualizada:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return transacao_atualizada


@app.delete("/transacoes/{transacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Remove uma transação do usuário autenticado."""
    repo = TransacaoRepository(db, usuario_id=usuario_atual.id)
    removido = repo.deletar(transacao_id)
    if not removido:
        raise HTTPException(status_code=404, detail="Transação não encontrada")


# --- ROTA DE FIIs EM TEMPO REAL (B3 via Yahoo Finance API com Cache) ---

# Cache em memória para não estourar rate limit da Yahoo Finance
FII_CACHE: dict = {"data": [], "updated_at": None}

FII_METADATA = [
    {"ticker": "MXRF11.SA", "nome": "Maxi Renda", "segmento": "Recebíveis", "cor": "#f59e0b", "dy": 0.124, "pvp": 1.02, "mkt": 2250000000},
    {"ticker": "HGLG11.SA", "nome": "CSHG Logística", "segmento": "Logística", "cor": "#3b82f6", "dy": 0.088, "pvp": 1.01, "mkt": 3780000000},
    {"ticker": "XPML11.SA", "nome": "XP Malls", "segmento": "Shopping", "cor": "#10b981", "dy": 0.092, "pvp": 1.04, "mkt": 3200000000},
    {"ticker": "KNRI11.SA", "nome": "Kinea Renda Imob.", "segmento": "Híbrido", "cor": "#8b5cf6", "dy": 0.082, "pvp": 0.97, "mkt": 3900000000},
    {"ticker": "BTLG11.SA", "nome": "BTG Logística", "segmento": "Logística", "cor": "#6366f1", "dy": 0.095, "pvp": 0.99, "mkt": 2800000000},
    {"ticker": "RECR11.SA", "nome": "REC Recebíveis", "segmento": "Recebíveis", "cor": "#ef4444", "dy": 0.128, "pvp": 0.89, "mkt": 2100000000},
    {"ticker": "VISC11.SA", "nome": "Vinci Shopping Centers", "segmento": "Shopping", "cor": "#f97316", "dy": 0.089, "pvp": 1.00, "mkt": 2500000000},
    {"ticker": "CPTS11.SA", "nome": "Capitânia Securities", "segmento": "Recebíveis", "cor": "#14b8a6", "dy": 0.118, "pvp": 0.91, "mkt": 2700000000},
    {"ticker": "BCFF11.SA", "nome": "BTG Fundo de Fundos", "segmento": "FoF", "cor": "#06b6d4", "dy": 0.098, "pvp": 0.93, "mkt": 1800000000},
    {"ticker": "RBVA11.SA", "nome": "Rio Bravo Varejo", "segmento": "Varejo", "cor": "#ec4899", "dy": 0.096, "pvp": 1.02, "mkt": 1400000000},
]


def calcular_score_fii(price: float, dy: float, pvp: float, vol: float, var: float) -> int:
    s = 0.0
    s += min((dy * 100) / 15, 1.0) * 40
    s += (1.0 if pvp <= 1.0 else 0.8 if pvp <= 1.2 else 0.5 if pvp <= 1.5 else 0.2) * 30
    s += min(vol / 5000000, 1.0) * 20
    s += (1.0 if var >= 0 else 0.7 if var >= -1.0 else 0.3) * 10
    return round(s)


@app.get("/fiis", response_model=list[FIISchema])
def obter_fiis_tempo_real():
    """Busca cotações em tempo real da B3 via Yahoo Finance API com cache de 10 min."""
    now = datetime.now(timezone.utc)
    
    # Retorna do cache se atualizado há menos de 10 minutos
    if FII_CACHE["updated_at"] and (now - FII_CACHE["updated_at"]).total_seconds() < 600:
        return FII_CACHE["data"]

    resultados = []
    
    for meta in FII_METADATA:
        ticker = meta["ticker"]
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
        
        price = 0.0
        var_pct = 0.0
        vol = 0.0
        high = 0.0
        low = 0.0

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                result = data["chart"]["result"][0]
                meta_yh = result["meta"]
                quote = result["indicators"]["quote"][0]

                price = float(meta_yh.get("regularMarketPrice") or 0.0)
                prev_close = float(meta_yh.get("chartPreviousClose") or price or 1.0)
                if prev_close > 0 and price > 0:
                    var_pct = round(((price - prev_close) / prev_close) * 100, 2)
                
                high = float(meta_yh.get("fiftyTwoWeekHigh") or price * 1.1)
                low = float(meta_yh.get("fiftyTwoWeekLow") or price * 0.9)
                
                volumes = quote.get("volume") or []
                vol = float(volumes[0]) if volumes and volumes[0] else 1000000.0
        except (urllib.error.URLError, json.JSONDecodeError, KeyError, IndexError, ValueError) as e:
            logger.warning("Erro ao buscar cotação de %s: %s", ticker, e)

        # Se a busca falhou ou preço zerado, usa fallback para não quebrar a UI
        if price == 0.0:
            price = 10.0
            high = 11.0
            low = 9.0
            vol = 1000000.0

        score = calcular_score_fii(price, meta["dy"], meta["pvp"], vol, var_pct)

        resultados.append({
            "ticker": ticker,
            "symbol": ticker,
            "nome": meta["nome"],
            "segmento": meta["segmento"],
            "cor": meta["cor"],
            "price": price,
            "var": var_pct,
            "dy": meta["dy"],
            "pvp": meta["pvp"],
            "mkt": meta["mkt"],
            "vol": vol,
            "high": high,
            "low": low,
            "score": score,
        })

    # Ordena por score decrescente
    resultados.sort(key=lambda x: x["score"], reverse=True)

    FII_CACHE["data"] = resultados
    FII_CACHE["updated_at"] = now

    return resultados