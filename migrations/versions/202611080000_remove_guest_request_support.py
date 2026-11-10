"""Port removal of guest request support.

Revision ID: 202611080000
Revises: 202611060000

The Laravel migration also removed files from its configured public storage
disk. Flask has no legacy storage-root setting, so this revision only migrates
database objects; existing deployments should already have completed file cleanup.
"""
from alembic import op
import sqlalchemy as sa


revision = "202611080000"
down_revision = "202611060000"
branch_labels = None
depends_on = None

GUEST_STATUS_VALUES = (
    "Pending",
    "Approved",
    "Processing",
    "Ready for Pickup",
    "Rejected",
    "Completed",
)
GUEST_GENDER_VALUES = ("Male", "Female", "Prefer not to say")
FK_NAMING_CONVENTION = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
}


def _foreign_keys(table_name: str) -> list[dict[str, object]]:
    return sa.inspect(op.get_bind()).get_foreign_keys(table_name)


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("notifications"):
        columns = {
            column["name"] for column in inspector.get_columns("notifications")
        }
        if "guest_request_id" in columns:
            op.execute(
                sa.text(
                    "DELETE FROM notifications "
                    "WHERE guest_request_id IS NOT NULL"
                )
            )
            foreign_keys = [
                foreign_key
                for foreign_key in _foreign_keys("notifications")
                if foreign_key.get("constrained_columns") == ["guest_request_id"]
            ]
            with op.batch_alter_table(
                "notifications", naming_convention=FK_NAMING_CONVENTION
            ) as batch_op:
                for foreign_key in foreign_keys:
                    name = foreign_key.get("name") or (
                        "fk_notifications_guest_request_id_guest_requests"
                    )
                    batch_op.drop_constraint(str(name), type_="foreignkey")
                batch_op.drop_column("guest_request_id")

    if inspector.has_table("guest_requests"):
        op.drop_table("guest_requests")


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("guest_requests"):
        op.create_table(
            "guest_requests",
            sa.Column("guest_request_id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("first_name", sa.String(length=255), nullable=False),
            sa.Column("middle_name", sa.String(length=255), nullable=True),
            sa.Column("last_name", sa.String(length=255), nullable=False),
            sa.Column("birth_date", sa.Date(), nullable=False),
            sa.Column(
                "gender",
                sa.Enum(*GUEST_GENDER_VALUES, name="guest_requests_gender", create_constraint=True),
                nullable=False,
            ),
            sa.Column("civil_status", sa.String(length=255), nullable=False),
            sa.Column("address", sa.String(length=255), nullable=False),
            sa.Column("contact_number", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("valid_id_type", sa.String(length=255), nullable=False),
            sa.Column("valid_id_image", sa.String(length=255), nullable=False),
            sa.Column("document_type_id", sa.Integer(), nullable=False),
            sa.Column("purpose", sa.Text(), nullable=False),
            sa.Column("tracking_number", sa.String(length=255), nullable=False),
            sa.Column(
                "status",
                sa.Enum(*GUEST_STATUS_VALUES, name="guest_requests_status", create_constraint=True),
                server_default="Pending",
                nullable=False,
            ),
            sa.Column("remarks", sa.Text(), nullable=True),
            sa.Column("verified_by", sa.Integer(), nullable=True),
            sa.Column("verified_at", sa.DateTime(), nullable=True),
            sa.Column("approved_at", sa.DateTime(), nullable=True),
            sa.Column("ready_for_pickup_at", sa.DateTime(), nullable=True),
            sa.Column("claimed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(
                ["document_type_id"],
                ["document_types.document_type_id"],
                ondelete="CASCADE",
            ),
            sa.ForeignKeyConstraint(
                ["verified_by"], ["staff.staff_id"], ondelete="SET NULL"
            ),
            sa.PrimaryKeyConstraint("guest_request_id"),
            sa.UniqueConstraint("tracking_number"),
        )
        op.create_index(
            "guest_requests_analytics_created_deleted_index",
            "guest_requests",
            ["created_at", "deleted_at"],
            unique=False,
        )

    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("notifications"):
        columns = {
            column["name"] for column in inspector.get_columns("notifications")
        }
        if "guest_request_id" not in columns:
            with op.batch_alter_table(
                "notifications", naming_convention=FK_NAMING_CONVENTION
            ) as batch_op:
                batch_op.add_column(
                    sa.Column("guest_request_id", sa.Integer(), nullable=True)
                )
                batch_op.create_foreign_key(
                    "fk_notifications_guest_request_id_guest_requests",
                    "guest_requests",
                    ["guest_request_id"],
                    ["guest_request_id"],
                    ondelete="CASCADE",
                )
