from decimal import Decimal

import pytest
from pydantic import ValidationError

from src.models import FormaPagamento, TipoTransacao
from src.schemas import TransacaoCreate


def test_transacao_create_valida():
    transacao = TransacaoCreate(
        descricao="Fatura Cartão Nubank",
        tipo=TipoTransacao.GASTO,
        valor=Decimal("450.50"),
        categoria="Alimentação",
        forma_pagamento=FormaPagamento.CARTAO_CREDITO,
        banco="Nubank"
    )
    assert transacao.valor == Decimal("450.50")
    assert transacao.banco == "Nubank"


def test_transacao_create_valor_invalido():
    with pytest.raises(ValidationError):
        TransacaoCreate(
            descricao="Teste",
            tipo=TipoTransacao.GASTO,
            valor=Decimal("-10.00"),
            categoria="Invalida",
            forma_pagamento=FormaPagamento.PIX
        )