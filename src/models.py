import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
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
    criado_em = Column(DateTime, default=datetime.utcnow)

    cartoes = relationship("CartaoCreditoModel", back_populates="usuario", cascade="all, delete-orphan")
    transacoes = relationship("TransacaoModel", back_populates="usuario", cascade="all, delete-orphan")


class CartaoCreditoModel(Base):
    """Entidade para gestão de limites e datas de corte do cartão."""
    __tablename__ = "cartoes_credito"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nome = Column(String(50), nullable=False)
    limite_total = Column(Numeric(10, 2), nullable=False)
    dia_fechamento = Column(Integer, nullable=False)
    dia_vencimento = Column(Integer, nullable=False)

    usuario = relationship("UsuarioModel", back_populates="cartoes")
    transacoes = relationship("TransacaoModel", back_populates="cartao")


class TransacaoModel(Base):
    """Entidade de movimentação financeira atualizada."""
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, default=1)
    cartao_id = Column(Integer, ForeignKey("cartoes_credito.id"), nullable=True)
    descricao = Column(String(255), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    tipo = Column(Enum(TipoTransacao), nullable=False)
    categoria = Column(String(100), nullable=False, default="")
    forma_pagamento = Column(Enum(FormaPagamento), nullable=False, default=FormaPagamento.PIX)
    banco = Column(String(100), nullable=True)
    data_transacao = Column(DateTime, default=datetime.utcnow)
    data_vencimento = Column(Date, nullable=True)
    pago = Column(Boolean, nullable=False, default=True)

    usuario = relationship("UsuarioModel", back_populates="transacoes")
    cartao = relationship("CartaoCreditoModel", back_populates="transacoes")