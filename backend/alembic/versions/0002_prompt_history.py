"""Add prompt history table

Revision ID: 0002_prompt_history
Revises: 0001_initial
Create Date: 2026-04-29 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_prompt_history"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "prompt_history",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_prompt_history_user_id", "prompt_history", ["user_id"])
    op.create_index("ix_prompt_history_created_at", "prompt_history", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_prompt_history_created_at", table_name="prompt_history")
    op.drop_index("ix_prompt_history_user_id", table_name="prompt_history")
    op.drop_table("prompt_history")
