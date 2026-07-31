import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship

from src.database import Base


class FormaPagamento(str, enum.Enum):
    CARTAO_CREDITO = "CARTAO_CREDITO"
    CARTAO_DEBITO = "CARTAO_DEBITO"
    PIX = "PIX"
    BOLETO = "BOLETO"
    DINHEIRO = "DINHEIRO"


class TipoTransacao(str, enum.Enum):
    GANHO = "GANHO"
    GASTO = "GASTO"


class UsuarioModel(Base):
    """Modelo ORM para usuários do sistema."""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    codigo_recuperacao = Column(String(6), nullable=True)
    codigo_expiracao = Column(DateTime, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    cartoes = relationship("CartaoCreditoModel", back_populates="usuario", cascade="all, delete-orphan")
    transacoes = relationship("TransacaoModel", back_populates="usuario", cascade="all, delete-orphan")


class CartaoCreditoModel(Base):
    """Entidade para gestão de limites, fatura mensal e datas de corte do cartão."""
    __tablename__ = "cartoes_credito"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nome = Column(String(100), nullable=False)
    bandeira = Column(String(50), nullable=True)
    limite_total = Column(Numeric(12, 2), nullable=False)
    limite_usado = Column(Numeric(12, 2), default=0.00)
    fatura_mensal = Column(Numeric(12, 2), default=0.00)
    dia_fechamento = Column(Integer, nullable=False)
    dia_vencimento = Column(Integer, nullable=False)
    saldo_investimento = Column(Numeric(12, 2), nullable=True)
    detalhes = Column(String(255), nullable=True)
    cor_hex = Column(String(10), default="#06b6d4")

    usuario = relationship("UsuarioModel", back_populates="cartoes")


class TransacaoModel(Base):
    """Entidade de Lançamento Financeiro."""
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    descricao = Column(String(255), nullable=False)
    tipo = Column(Enum(TipoTransacao), nullable=False)
    valor = Column(Numeric(12, 2), nullable=False)
    categoria = Column(String(100), nullable=False)
    forma_pagamento = Column(Enum(FormaPagamento), nullable=False)
    banco = Column(String(100), nullable=True)
    data_transacao = Column(Date, nullable=False)
    data_vencimento = Column(Date, nullable=True)
    pago = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("UsuarioModel", back_populates="transacoes")