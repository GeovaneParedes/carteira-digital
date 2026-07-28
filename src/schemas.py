from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Optional

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
    banco: Optional[str] = None
    data_transacao: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    data_vencimento: Optional[date] = None
    pago: bool = True

    @field_validator("data_vencimento", "data_transacao", "banco", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v


class TransacaoUpdate(BaseModel):
    """DTO para atualização parcial de transação."""

    descricao: Optional[str] = Field(default=None, min_length=1, max_length=255)
    tipo: Optional[TipoTransacao] = None
    valor: Optional[Decimal] = Field(default=None, gt=0)
    categoria: Optional[str] = Field(default=None, min_length=1, max_length=100)
    forma_pagamento: Optional[FormaPagamento] = None
    banco: Optional[str] = None
    data_transacao: Optional[datetime] = None
    data_vencimento: Optional[date] = None
    pago: Optional[bool] = None

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