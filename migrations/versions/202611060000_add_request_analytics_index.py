"""Port the request analytics index migration.

Revision ID: 202611060000
Revises: 76450ebff7ae
"""
from alembic import op
import sqlalchemy as sa


revision = "202611060000"
down_revision = "76450ebff7ae"
branch_labels = None
depends_on = None

INDEX_NAME = "barangay_requests_analytics_created_deleted_index"


def _index_exists() -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(
        index["name"] == INDEX_NAME
        for index in inspector.get_indexes("barangay_requests")
    )


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("barangay_requests"):
        raise RuntimeError("barangay_requests must exist before adding its index.")

    columns = {column["name"] for column in inspector.get_columns("barangay_requests")}
    if {"created_at", "deleted_at"}.issubset(columns) and not _index_exists():
        op.create_index(
            INDEX_NAME,
            "barangay_requests",
            ["created_at", "deleted_at"],
            unique=False,
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("barangay_requests") and _index_exists():
        op.drop_index(INDEX_NAME, table_name="barangay_requests")
