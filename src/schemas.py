from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.models import FormaPagamento, TipoTransacao


class UsuarioCreate(BaseModel):
    """DTO para criação de usuário."""

    nome: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1, max_length=150)
    senha: str = Field(..., min_length=6, max_length=255)


class UsuarioLogin(BaseModel):
    """DTO para autenticação de usuário."""

    email: str = Field(..., min_length=1, max_length=150)
    senha: str = Field(..., min_length=6, max_length=255)


class EsqueciSenhaRequest(BaseModel):
    """DTO para solicitar código de recuperação via e-mail."""

    email: str = Field(..., min_length=1, max_length=150)


class RedefinirSenhaRequest(BaseModel):
    """DTO para redefinir senha informando código de 6 dígitos."""

    email: str = Field(..., min_length=1, max_length=150)
    codigo: str = Field(..., min_length=6, max_length=6)
    nova_senha: str = Field(..., min_length=6, max_length=255)


class TokenResponse(BaseModel):
    """DTO de resposta com token JWT mínimo."""

    access_token: str
    token_type: str = "bearer"


class CartaoCreditoCreate(BaseModel):
    """DTO para criação e atualização de cartão de crédito."""

    nome: str = Field(..., min_length=1, max_length=100)
    bandeira: str | None = "Visa"
    limiteTotal: Decimal = Field(..., ge=0)
    limiteUsado: Decimal = Field(default=Decimal("0.00"), ge=0)
    faturaMensal: Decimal = Field(default=Decimal("0.00"), ge=0)
    diaFechamento: int = Field(..., ge=1, le=31)
    diaVencimento: int = Field(..., ge=1, le=31)
    saldoInvestimento: Decimal | None = None
    detalhes: str | None = None
    corHex: str | None = "#06b6d4"


class CartaoCreditoResponse(BaseModel):
    """DTO de resposta para cartão de crédito."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    nome: str
    bandeira: str | None = None
    limiteTotal: Decimal = Field(..., alias="limite_total")
    limiteUsado: Decimal = Field(..., alias="limite_usado")
    faturaMensal: Decimal = Field(..., alias="fatura_mensal")
    diaFechamento: int = Field(..., alias="dia_fechamento")
    diaVencimento: int = Field(..., alias="dia_vencimento")
    saldoInvestimento: Decimal | None = Field(None, alias="saldo_investimento")
    detalhes: str | None = None
    corHex: str | None = Field("#06b6d4", alias="cor_hex")


class TransacaoCreate(BaseModel):
    """DTO para criação de transação."""

    descricao: str = Field(..., min_length=1, max_length=255)
    tipo: TipoTransacao
    valor: Decimal = Field(..., gt=0)
    categoria: str = Field(..., min_length=1, max_length=100)
    forma_pagamento: FormaPagamento
    banco: str | None = None
    data_transacao: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    data_vencimento: date | None = None
    pago: bool = True

    @field_validator("data_vencimento", "data_transacao", "banco", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v


class TransacaoUpdate(BaseModel):
    """DTO para atualização parcial de transação."""

    descricao: str | None = Field(default=None, min_length=1, max_length=255)
    tipo: TipoTransacao | None = None
    valor: Decimal | None = Field(default=None, gt=0)
    categoria: str | None = Field(default=None, min_length=1, max_length=100)
    forma_pagamento: FormaPagamento | None = None
    banco: str | None = None
    data_transacao: datetime | None = None
    data_vencimento: date | None = None
    pago: bool | None = None


class TransacaoResponse(BaseModel):
    """DTO de saída para transações."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    descricao: str
    tipo: TipoTransacao
    valor: Decimal
    categoria: str
    forma_pagamento: FormaPagamento
    banco: str | None = None
    data_transacao: date
    data_vencimento: date | None = None
    pago: bool


class BalancoResponse(BaseModel):
    """DTO para envio do balanço resumido ao dashboard."""

    total_ganhos: Decimal
    total_gastos: Decimal
    despesas_pendentes: Decimal
    despesas_pagas: Decimal
    saldo_atual: Decimal


class FIISchema(BaseModel):
    """DTO para cotações reais de FIIs buscados da B3 (via Yahoo Finance)."""

    ticker: str
    symbol: str
    nome: str
    segmento: str
    cor: str
    price: float
    var: float
    dy: float
    pvp: float
    mkt: float
    vol: float
    high: float
    low: float
    score: int = 0