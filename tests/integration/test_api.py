import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import get_db
from src.main import app
from src.models import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    registrar = client.post(
        "/auth/registrar",
        json={
            "nome": "Usuário Teste",
            "email": "teste@email.com",
            "senha": "senha123",
        },
    )
    assert registrar.status_code == 201

    login = client.post(
        "/auth/login",
        json={
            "email": "teste@email.com",
            "senha": "senha123",
        },
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_criar_e_listar_transacao_sucesso(client, auth_headers):
    payload = {
        "descricao": "Fatura Cartão Nubank",
        "tipo": "GASTO",
        "valor": 1250.75,
        "categoria": "Cartão de Crédito",
        "forma_pagamento": "CARTAO_CREDITO",
        "banco": "Nubank",
        "data_vencimento": "2026-08-10",
        "pago": False,
    }

    response_post = client.post("/transacoes", json=payload, headers=auth_headers)
    assert response_post.status_code == 201
    data = response_post.json()
    assert data["id"] is not None
    assert data["descricao"] == payload["descricao"]
    assert float(data["valor"]) == payload["valor"]

    response_get = client.get("/transacoes", headers=auth_headers)
    assert response_get.status_code == 200
    list_data = response_get.json()
    assert len(list_data) == 1
    assert list_data[0]["banco"] == "Nubank"


def test_obter_balanco(client, auth_headers):
    client.post(
        "/transacoes",
        json={
            "descricao": "Salário",
            "tipo": "GANHO",
            "valor": 5000.00,
            "categoria": "Renda",
            "forma_pagamento": "PIX",
            "banco": "Itaú",
        },
        headers=auth_headers,
    )

    client.post(
        "/transacoes",
        json={
            "descricao": "Mercado",
            "tipo": "GASTO",
            "valor": 1500.00,
            "categoria": "Alimentação",
            "forma_pagamento": "CARTAO_DEBITO",
            "banco": "Itaú",
        },
        headers=auth_headers,
    )

    response_balanco = client.get("/transacoes/balanco", headers=auth_headers)
    assert response_balanco.status_code == 200
    balanco = response_balanco.json()

    assert float(balanco["total_ganhos"]) == 5000.00
    assert float(balanco["total_gastos"]) == 1500.00
    assert float(balanco["saldo_atual"]) == 3500.00


def test_login_retorna_token_e_rota_protegida_exige_autorizacao(client):
    registrar = client.post(
        "/auth/registrar",
        json={
            "nome": "Usuário Teste",
            "email": "teste@email.com",
            "senha": "senha123",
        },
    )
    assert registrar.status_code == 201

    login = client.post(
        "/auth/login",
        json={
            "email": "teste@email.com",
            "senha": "senha123",
        },
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert token

    sem_token = client.get("/transacoes")
    assert sem_token.status_code == 401

    com_token = client.get("/transacoes", headers={"Authorization": f"Bearer {token}"})
    assert com_token.status_code == 200


def test_isolamento_multi_tenant_entre_usuarios(client, auth_headers):
    """Garante que o Usuário B não veja as transações do Usuário A (Isolamento de Segurança)."""
    # 1. Usuário A cria uma transação
    client.post(
        "/transacoes",
        json={
            "descricao": "Conta Secreta do Usuário A",
            "tipo": "GASTO",
            "valor": 999.00,
            "categoria": "Pessoal",
            "forma_pagamento": "PIX",
        },
        headers=auth_headers,
    )

    # 2. Registrar e logar Usuário B
    client.post(
        "/auth/registrar",
        json={
            "nome": "Usuário B",
            "email": "usuarioB@email.com",
            "senha": "senha456",
        },
    )
    login_b = client.post(
        "/auth/login",
        json={"email": "usuarioB@email.com", "senha": "senha456"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Usuário B lista transações (deve vir vazio!)
    res_b = client.get("/transacoes", headers=headers_b)
    assert res_b.status_code == 200
    assert len(res_b.json()) == 0

    # 4. Usuário B tenta ver o balanço (deve ser 0)
    bal_b = client.get("/transacoes/balanco", headers=headers_b).json()
    assert float(bal_b["saldo_atual"]) == 0.00


def test_pagar_fatura_cartao(client, auth_headers):
    # Obtém cartões padrão criados no registro
    cartoes = client.get("/cartoes", headers=auth_headers).json()
    assert len(cartoes) > 0
    cartao_id = cartoes[0]["id"]

    # Atualiza cartão com fatura mensal
    client.put(
        f"/cartoes/{cartao_id}",
        json={
            "nome": "Cartão Teste",
            "bandeira": "Mastercard",
            "limiteTotal": 5000.00,
            "limiteUsado": 1500.00,
            "faturaMensal": 500.00,
            "diaFechamento": 10,
            "diaVencimento": 17,
        },
        headers=auth_headers,
    )

    # Dar baixa na fatura mensal
    res_pagar = client.post(f"/cartoes/{cartao_id}/pagar", headers=auth_headers)
    assert res_pagar.status_code == 200
    data = res_pagar.json()
    assert float(data.get("fatura_mensal", data.get("faturaMensal"))) == 0.00
    assert float(data.get("limite_usado", data.get("limiteUsado"))) == 1000.00