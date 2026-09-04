from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from src.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _is_sqlite() -> bool:
    return str(engine.url).startswith("sqlite")


def _sqlite_column_names(table_name: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return {str(row[1]) for row in rows}


def _sqlite_add_column_if_missing(table_name: str, column_name: str, definition: str) -> None:
    existing = _sqlite_column_names(table_name)
    if column_name in existing:
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"))


def _sqlite_safe_backfill_and_normalize() -> None:
    """Ajustes compatíveis com bancos legados usados em dev local."""
    with engine.begin() as conn:
        # Garante parse de Date no SQLAlchemy quando dados antigos vieram com timestamp.
        conn.execute(
            text(
                """
                UPDATE transacoes
                SET data_transacao = substr(CAST(data_transacao AS TEXT), 1, 10)
                WHERE data_transacao IS NOT NULL
                  AND length(CAST(data_transacao AS TEXT)) > 10
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE transacoes
                SET data_vencimento = substr(CAST(data_vencimento AS TEXT), 1, 10)
                WHERE data_vencimento IS NOT NULL
                  AND length(CAST(data_vencimento AS TEXT)) > 10
                """
            )
        )


def _apply_sqlite_local_migrations() -> None:
    if not _is_sqlite():
        return

    # Cartões: colunas adicionadas em versões recentes do projeto.
    _sqlite_add_column_if_missing("cartoes_credito", "limite_usado", "NUMERIC(12,2) DEFAULT 0")
    _sqlite_add_column_if_missing("cartoes_credito", "fatura_mensal", "NUMERIC(12,2) DEFAULT 0")
    _sqlite_add_column_if_missing("cartoes_credito", "dia_fechamento", "INTEGER DEFAULT 1")
    _sqlite_add_column_if_missing("cartoes_credito", "dia_vencimento", "INTEGER DEFAULT 10")
    _sqlite_add_column_if_missing("cartoes_credito", "saldo_investimento", "NUMERIC(12,2)")
    _sqlite_add_column_if_missing("cartoes_credito", "detalhes", "VARCHAR(255)")
    _sqlite_add_column_if_missing("cartoes_credito", "cor_hex", "VARCHAR(10) DEFAULT '#06b6d4'")

    # Transações: campos presentes no modelo atual.
    _sqlite_add_column_if_missing("transacoes", "banco", "VARCHAR(100)")
    _sqlite_add_column_if_missing("transacoes", "data_vencimento", "DATE")
    _sqlite_add_column_if_missing("transacoes", "pago", "BOOLEAN DEFAULT 1")

    _sqlite_safe_backfill_and_normalize()


def init_db() -> None:
    """Cria as tabelas do banco ao iniciar a aplicação em ambiente local."""
    Base.metadata.create_all(bind=engine)
    _apply_sqlite_local_migrations()


def get_db() -> Generator[Session, None, None]:
    """Dependency injection para sessões de banco de dados no FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()