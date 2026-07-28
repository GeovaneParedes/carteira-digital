
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.models import TipoTransacao, TransacaoModel
from src.schemas import BalancoResponse, TransacaoCreate, TransacaoUpdate


class TransacaoRepository:
    """Camada de persistência de dados isolada por usuário (Multi-tenant)."""

    def __init__(self, db_session: Session, usuario_id: int):
        self.db = db_session
        self.usuario_id = usuario_id

    def criar(self, transacao_in: TransacaoCreate) -> TransacaoModel:
        dados = transacao_in.model_dump()
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