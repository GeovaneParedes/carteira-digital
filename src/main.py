from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import random

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from src.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from src.database import get_db, init_db
from src.email_service import enviar_email_codigo_recuperacao
from src.models import UsuarioModel
from src.repository import TransacaoRepository
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
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida do app inicializando o banco de dados."""
    init_db()
    yield


app = FastAPI(
    title="API Carteira Digital Enterprise",
    description="Backend seguro e escalável de Gestão Financeira Pessoal com isolamento por usuário.",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/registrar", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra um novo usuário com senha hashada e retorna token JWT."""
    email_existente = db.query(UsuarioModel).filter(UsuarioModel.email == usuario_in.email).first()
    if email_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    usuario = UsuarioModel(
        nome=usuario_in.nome,
        email=usuario_in.email,
        senha_hash=hash_password(usuario_in.senha),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return TokenResponse(access_token=create_access_token(usuario.email))


@app.post("/auth/login", response_model=TokenResponse)
def login_usuario(usuario_in: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica o usuário e devolve um token de acesso."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == usuario_in.email).first()
    if not usuario or not verify_password(usuario_in.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return TokenResponse(access_token=create_access_token(usuario.email))


@app.post("/auth/esqueci-senha")
def solicitar_codigo_recuperacao(data: EsqueciSenhaRequest, db: Session = Depends(get_db)):
    """Gera um código de 6 dígitos e envia por e-mail para o usuário."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == data.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado com este e-mail")

    # Gera código aleatório de 6 dígitos
    codigo = f"{random.randint(100000, 999999)}"
    usuario.codigo_recuperacao = codigo
    usuario.codigo_expiracao = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    # Envia e-mail
    enviado = enviar_email_codigo_recuperacao(usuario.email, codigo)
    if not enviado:
        raise HTTPException(status_code=500, detail="Erro ao enviar e-mail de verificação")

    return {"message": "Código de recuperação enviado para o seu e-mail!"}


@app.post("/auth/redefinir-senha", response_model=TokenResponse)
def redefinir_senha(data: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    """Valida o código de 6 dígitos enviado por e-mail e atualiza a senha do usuário."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == data.email).first()
    if not usuario or usuario.codigo_recuperacao != data.codigo:
        raise HTTPException(status_code=400, detail="Código de verificação inválido ou incorreto")

    if usuario.codigo_expiracao and usuario.codigo_expiracao.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="O código de verificação expirou. Solicite um novo.")

    # Atualiza a senha hashada e limpa o código usado
    usuario.senha_hash = hash_password(data.nova_senha)
    usuario.codigo_recuperacao = None
    usuario.codigo_expiracao = None
    db.commit()

    return TokenResponse(access_token=create_access_token(usuario.email))


@app.get("/transacoes", response_model=list[TransacaoResponse])
def listar_transacoes(
    db: Session = Depends(get_db),
    usuario_atual: UsuarioModel = Depends(get_current_user),
):
    """Lista todas as transações pertencentes estritamente ao usuário autenticado."""
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
    return None