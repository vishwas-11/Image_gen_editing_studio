"""Convert legacy string ID columns to UUID

Revision ID: 0003_fix_legacy_uuid_columns
Revises: 0002_prompt_history
Create Date: 2026-04-30 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_fix_legacy_uuid_columns"
down_revision = "0002_prompt_history"
branch_labels = None
depends_on = None


UUID_COLUMNS = [
    ("users", "id"),
    ("images", "id"),
    ("images", "user_id"),
    ("collections", "id"),
    ("collections", "user_id"),
    ("image_collections", "id"),
    ("image_collections", "image_id"),
    ("image_collections", "collection_id"),
    ("prompt_history", "id"),
    ("prompt_history", "user_id"),
]


FK_COLUMNS = [
    ("images", "user_id", "users", "id", "images_user_id_fkey"),
    ("collections", "user_id", "users", "id", "collections_user_id_fkey"),
    ("image_collections", "image_id", "images", "id", "image_collections_image_id_fkey"),
    (
        "image_collections",
        "collection_id",
        "collections",
        "id",
        "image_collections_collection_id_fkey",
    ),
    ("prompt_history", "user_id", "users", "id", "prompt_history_user_id_fkey"),
]


def _column_type(bind: sa.Connection, table_name: str, column_name: str) -> str | None:
    return bind.execute(
        sa.text(
            """
            select data_type
            from information_schema.columns
            where table_schema = current_schema()
              and table_name = :table_name
              and column_name = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).scalar_one_or_none()


def _drop_foreign_keys(bind: sa.Connection) -> None:
    for table_name, column_name, _, _, fallback_name in FK_COLUMNS:
        constraint_names = bind.execute(
            sa.text(
                """
                select tc.constraint_name
                from information_schema.table_constraints tc
                join information_schema.key_column_usage kcu
                  on tc.constraint_name = kcu.constraint_name
                 and tc.table_schema = kcu.table_schema
                where tc.constraint_type = 'FOREIGN KEY'
                  and tc.table_schema = current_schema()
                  and tc.table_name = :table_name
                  and kcu.column_name = :column_name
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        ).scalars().all()

        if constraint_names:
            for constraint_name in constraint_names:
                op.drop_constraint(constraint_name, table_name, type_="foreignkey")
        else:
            # If the database uses the conventional names from this project, this is
            # the name we recreate below. No-op here if nothing was found.
            _ = fallback_name


def _alter_uuid_columns(bind: sa.Connection) -> None:
    for table_name, column_name in UUID_COLUMNS:
        if _column_type(bind, table_name, column_name) == "character varying":
            op.execute(
                sa.text(
                    f'alter table "{table_name}" alter column "{column_name}" '
                    f"type uuid using \"{column_name}\"::uuid"
                )
            )


def _recreate_foreign_keys() -> None:
    for table_name, column_name, referred_table, referred_column, constraint_name in FK_COLUMNS:
        op.create_foreign_key(
            constraint_name,
            table_name,
            referred_table,
            [column_name],
            [referred_column],
            ondelete="CASCADE",
        )


def upgrade() -> None:
    bind = op.get_bind()

    if _column_type(bind, "users", "id") != "character varying":
        return

    _drop_foreign_keys(bind)
    _alter_uuid_columns(bind)
    _recreate_foreign_keys()


def downgrade() -> None:
    bind = op.get_bind()

    if _column_type(bind, "users", "id") != "uuid":
        return

    _drop_foreign_keys(bind)

    for table_name, column_name in UUID_COLUMNS:
        op.execute(
            sa.text(
                f'alter table "{table_name}" alter column "{column_name}" '
                f"type varchar using \"{column_name}\"::varchar"
            )
        )

    _recreate_foreign_keys()
