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


class TokenResponse(BaseModel):
    """DTO de resposta com token JWT mínimo."""

    access_token: str
    token_type: str = "bearer"


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

    model_config = ConfigDict(extra="ignore")

    @field_validator("data_vencimento", "data_transacao", "banco", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v


class TransacaoResponse(TransacaoCreate):
    """DTO de resposta de transação."""

    id: int

    model_config = ConfigDict(from_attributes=True)


class BalancoResponse(BaseModel):
    """DTO para resumo de balanço financeiro."""

    total_ganhos: Decimal
    total_gastos: Decimal
    saldo_atual: Decimal