from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from src.auth import (
    criar_token_acesso,
    get_current_user,
    hash_password,
    verificar_senha,
)
from src.database import Base, engine, get_db
from src.email_service import enviar_email_recuperacao
from src.models import UsuarioModel, CartaoCreditoModel
from src.repository import TransacaoRepository, CartaoRepository
from src.schemas import (
    BalancoResponse,
    EsqueciSenhaRequest,
    RedefinirSenhaRequest,
    TokenResponse,
    TransacaoCreate,
    TransacaoResponse,
    TransacaoUpdate,
    UsuarioCreate,
    UsuarioLogin,
    CartaoCreditoCreate,
    CartaoCreditoResponse,
)

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

    token = criar_token_acesso(novo_usuario.email)
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def login(usuario_in: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica o usuário e gera o JWT Token."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == usuario_in.email).first()
    if not usuario or not verificar_senha(usuario_in.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = criar_token_acesso(usuario.email)
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
        enviar_email_recuperacao(usuario.email, codigo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar e-mail: {str(e)}")

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

    token = criar_token_acesso(usuario.email)
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