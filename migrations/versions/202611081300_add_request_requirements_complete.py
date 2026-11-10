"""Port the requirements-complete request field migration.

Revision ID: 202611081300
Revises: 202611081200
"""
from alembic import op
import sqlalchemy as sa


revision = "202611081300"
down_revision = "202611081200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("barangay_requests"):
        raise RuntimeError(
            "barangay_requests must exist before adding requirements_complete."
        )
    columns = {
        column["name"] for column in inspector.get_columns("barangay_requests")
    }
    if "requirements_complete" not in columns:
        with op.batch_alter_table("barangay_requests") as batch_op:
            batch_op.add_column(
                sa.Column(
                    "requirements_complete",
                    sa.Boolean(),
                    server_default=sa.false(),
                    nullable=False,
                )
            )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("barangay_requests") and "requirements_complete" in {
        column["name"]
        for column in inspector.get_columns("barangay_requests")
    }:
        with op.batch_alter_table("barangay_requests") as batch_op:
            batch_op.drop_column("requirements_complete")
