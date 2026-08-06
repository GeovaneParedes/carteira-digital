from sqlalchemy import func
from sqlalchemy.orm import Session

from src.models import CartaoCreditoModel, TipoTransacao, TransacaoModel
from src.schemas import (
    BalancoResponse,
    CartaoCreditoCreate,
    TransacaoCreate,
    TransacaoUpdate,
)


class CartaoRepository:
    """Camada de persistência para cartões de crédito em banco de dados isolados por usuário."""

    def __init__(self, db_session: Session, usuario_id: int):
        self.db = db_session
        self.usuario_id = usuario_id

    def listar_todos(self) -> list[CartaoCreditoModel]:
        return (
            self.db.query(CartaoCreditoModel)
            .filter(CartaoCreditoModel.usuario_id == self.usuario_id)
            .order_by(CartaoCreditoModel.dia_fechamento.asc(), CartaoCreditoModel.id.asc())
            .all()
        )

    def obter_por_id(self, cartao_id: int) -> CartaoCreditoModel | None:
        return (
            self.db.query(CartaoCreditoModel)
            .filter(
                CartaoCreditoModel.id == cartao_id,
                CartaoCreditoModel.usuario_id == self.usuario_id,
            )
            .first()
        )

    def criar(self, cartao_in: CartaoCreditoCreate) -> CartaoCreditoModel:
        cartao = CartaoCreditoModel(
            usuario_id=self.usuario_id,
            nome=cartao_in.nome,
            bandeira=cartao_in.bandeira,
            limite_total=cartao_in.limiteTotal,
            limite_usado=cartao_in.limiteUsado,
            fatura_mensal=cartao_in.faturaMensal,
            dia_fechamento=cartao_in.diaFechamento,
            dia_vencimento=cartao_in.diaVencimento,
            saldo_investimento=cartao_in.saldoInvestimento,
            detalhes=cartao_in.detalhes,
            cor_hex=cartao_in.corHex or "#06b6d4",
        )
        self.db.add(cartao)
        self.db.commit()
        self.db.refresh(cartao)
        return cartao

    def atualizar(self, cartao_id: int, cartao_in: CartaoCreditoCreate) -> CartaoCreditoModel | None:
        cartao = self.obter_por_id(cartao_id)
        if not cartao:
            return None

        cartao.nome = cartao_in.nome
        cartao.bandeira = cartao_in.bandeira
        cartao.limite_total = cartao_in.limiteTotal
        cartao.limite_usado = cartao_in.limiteUsado
        cartao.fatura_mensal = cartao_in.faturaMensal
        cartao.dia_fechamento = cartao_in.diaFechamento
        cartao.dia_vencimento = cartao_in.diaVencimento
        cartao.saldo_investimento = cartao_in.saldoInvestimento
        cartao.detalhes = cartao_in.detalhes
        if cartao_in.corHex:
            cartao.cor_hex = cartao_in.corHex

        self.db.commit()
        self.db.refresh(cartao)
        return cartao

    def deletar(self, cartao_id: int) -> bool:
        cartao = self.obter_por_id(cartao_id)
        if not cartao:
            return False
        self.db.delete(cartao)
        self.db.commit()
        return True

    def inicializar_cartoes_padrao(self) -> list[CartaoCreditoModel]:
        cartoes_iniciais = [
            CartaoCreditoCreate(
                nome="Cartão Principal (Modelo)",
                bandeira="Mastercard",
                limiteTotal=5000.00,
                limiteUsado=0.00,
                faturaMensal=0.00,
                diaFechamento=10,
                diaVencimento=17,
                saldoInvestimento=0.00,
                detalhes="Seu cartão principal. Edite com seus dados reais.",
                corHex="#8b5cf6",
            ),
            CartaoCreditoCreate(
                nome="Cartão Secundário (Modelo)",
                bandeira="Visa",
                limiteTotal=3000.00,
                limiteUsado=0.00,
                faturaMensal=0.00,
                diaFechamento=5,
                diaVencimento=12,
                saldoInvestimento=0.00,
                detalhes="Seu cartão secundário ou reserva.",
                corHex="#3b82f6",
            ),
        ]
        criados = []
        for c in cartoes_iniciais:
            criados.append(self.criar(c))
        return criados


class TransacaoRepository:
    """Camada de persistência de dados isolada por usuário (Multi-tenant)."""

    def __init__(self, db_session: Session, usuario_id: int):
        self.db = db_session
        self.usuario_id = usuario_id

    def criar(self, transacao_in: TransacaoCreate) -> TransacaoModel:
        dados = transacao_in.model_dump()
        # Garante que data_transacao seja date puro (sem hora) para evitar
        # erro de validação do Pydantic v2 na resposta (date_from_datetime_inexact)
        if dados.get("data_transacao") and hasattr(dados["data_transacao"], "date"):
            dados["data_transacao"] = dados["data_transacao"].date()
        transacao = TransacaoModel(**dados, usuario_id=self.usuario_id)
        self.db.add(transacao)
        self.db.commit()
        self.db.refresh(transacao)
        return transacao

    def listar_todas(self) -> list[TransacaoModel]:
        return (
            self.db.query(TransacaoModel)
            .filter(TransacaoModel.usuario_id == self.usuario_id)
            .order_by(TransacaoModel.data_transacao.desc())
            .all()
        )

    def obter_por_id(self, transacao_id: int) -> TransacaoModel | None:
        return (
            self.db.query(TransacaoModel)
            .filter(
                TransacaoModel.id == transacao_id,
                TransacaoModel.usuario_id == self.usuario_id,
            )
            .first()
        )

    def atualizar(self, transacao_id: int, transacao_in: TransacaoUpdate) -> TransacaoModel | None:
        transacao = self.obter_por_id(transacao_id)
        if not transacao:
            return None

        dados = transacao_in.model_dump(exclude_unset=True)
        # Garante que data_transacao seja date puro (sem hora)
        if "data_transacao" in dados and dados["data_transacao"] and hasattr(dados["data_transacao"], "date"):
            dados["data_transacao"] = dados["data_transacao"].date()
        for campo, valor in dados.items():
            setattr(transacao, campo, valor)

        self.db.commit()
        self.db.refresh(transacao)
        return transacao

    def deletar(self, transacao_id: int) -> bool:
        transacao = self.obter_por_id(transacao_id)
        if not transacao:
            return False
        self.db.delete(transacao)
        self.db.commit()
        return True

    def calcular_balanco(self) -> BalancoResponse:
        ganhos = (
            self.db.query(func.coalesce(func.sum(TransacaoModel.valor), 0))
            .filter(
                TransacaoModel.usuario_id == self.usuario_id,
                TransacaoModel.tipo == TipoTransacao.GANHO,
            )
            .scalar()
        )
        gastos = (
            self.db.query(func.coalesce(func.sum(TransacaoModel.valor), 0))
            .filter(
                TransacaoModel.usuario_id == self.usuario_id,
                TransacaoModel.tipo == TipoTransacao.GASTO,
            )
            .scalar()
        )

        return BalancoResponse(
            total_ganhos=ganhos,
            total_gastos=gastos,
            saldo_atual=ganhos - gastos,
        )