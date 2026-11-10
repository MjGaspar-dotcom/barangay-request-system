"""Port the Google ID user field migration.

Revision ID: 202611081400
Revises: 202611081300
"""
from alembic import op
import sqlalchemy as sa


revision = "202611081400"
down_revision = "202611081300"
branch_labels = None
depends_on = None

UNIQUE_NAME = "users_google_id_unique"


def _google_id_is_unique(inspector: sa.Inspector) -> bool:
    if any(
        constraint.get("column_names") == ["google_id"]
        for constraint in inspector.get_unique_constraints("users")
    ):
        return True
    return any(
        index.get("unique")
        and index.get("column_names") == ["google_id"]
        for index in inspector.get_indexes("users")
    )


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("users"):
        raise RuntimeError("users must exist before adding google_id.")

    columns = {column["name"] for column in inspector.get_columns("users")}
    has_google_id = "google_id" in columns
    has_unique = _google_id_is_unique(inspector) if has_google_id else False
    if has_google_id and has_unique:
        return

    with op.batch_alter_table("users") as batch_op:
        if not has_google_id:
            batch_op.add_column(sa.Column("google_id", sa.String(length=255)))
        if not has_unique:
            batch_op.create_unique_constraint(UNIQUE_NAME, ["google_id"])


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("users"):
        return
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "google_id" not in columns:
        return

    with op.batch_alter_table("users") as batch_op:
        for constraint in inspector.get_unique_constraints("users"):
            if constraint.get("column_names") == ["google_id"] and constraint.get(
                "name"
            ):
                batch_op.drop_constraint(constraint["name"], type_="unique")
        for index in inspector.get_indexes("users"):
            if index.get("unique") and index.get("column_names") == ["google_id"]:
                batch_op.drop_index(index["name"])
        batch_op.drop_column("google_id")
