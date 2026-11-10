"""Port the barangay request workflow migration.

Revision ID: 202611081200
Revises: 202611080000
"""
from alembic import op
import sqlalchemy as sa


revision = "202611081200"
down_revision = "202611080000"
branch_labels = None
depends_on = None

PURPOSE_VALUES = (
    "additional_requirement",
    "prepared_document",
    "signed_document",
)
FK_NAMING_CONVENTION = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
}
USER_FOREIGN_KEYS = {
    "processing_by": "fk_barangay_requests_processing_by_users",
    "document_prepared_by": "fk_barangay_requests_document_prepared_by_users",
    "document_signed_by": "fk_barangay_requests_document_signed_by_users",
    "released_by": "fk_barangay_requests_released_by_users",
}
DOCUMENT_FOREIGN_KEYS = {
    "prepared_document_id": "fk_barangay_requests_prepared_document_id_documents",
    "signed_document_id": "fk_barangay_requests_signed_document_id_documents",
}


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def _column_type(table_name: str, column_name: str) -> sa.types.TypeEngine:
    for column in sa.inspect(op.get_bind()).get_columns(table_name):
        if column["name"] == column_name:
            return column["type"]
    raise RuntimeError(f"{table_name}.{column_name} is required for this migration.")


def _has_foreign_key(
    table_name: str, column_name: str, referred_table: str
) -> bool:
    return any(
        foreign_key.get("constrained_columns") == [column_name]
        and foreign_key.get("referred_table") == referred_table
        for foreign_key in sa.inspect(op.get_bind()).get_foreign_keys(table_name)
    )


def _add_request_columns(
    columns: dict[str, sa.types.TypeEngine],
    foreign_keys: dict[str, tuple[str, str, str]],
) -> None:
    existing_columns = _columns("barangay_requests")
    if not existing_columns:
        raise RuntimeError(
            "barangay_requests must exist before adding workflow fields."
        )

    existing_foreign_keys = {
        column_name: _has_foreign_key("barangay_requests", column_name, target_table)
        for column_name, (target_table, _, _) in foreign_keys.items()
    }
    target_types = {
        column_name: _column_type(target_table, target_column)
        for column_name, (target_table, target_column, _) in foreign_keys.items()
    }
    existing_types = {
        column["name"]: column["type"]
        for column in sa.inspect(op.get_bind()).get_columns("barangay_requests")
        if column["name"] in foreign_keys
    }
    mismatched_types = {
        column_name: existing_type
        for column_name, existing_type in existing_types.items()
        if existing_type.compile(dialect=op.get_bind().dialect)
        != target_types[column_name].compile(dialect=op.get_bind().dialect)
    }
    if all(name in existing_columns for name in columns) and all(
        existing_foreign_keys.values()
    ) and not mismatched_types:
        return

    with op.batch_alter_table(
        "barangay_requests", naming_convention=FK_NAMING_CONVENTION
    ) as batch_op:
        for name, column_type in columns.items():
            if name not in existing_columns:
                batch_op.add_column(
                    sa.Column(name, target_types.get(name, column_type), nullable=True)
                )
            elif name in mismatched_types:
                batch_op.alter_column(
                    name,
                    existing_type=mismatched_types[name],
                    type_=target_types[name],
                    existing_nullable=True,
                )
        for name, (target_table, target_column, constraint_name) in foreign_keys.items():
            if not existing_foreign_keys[name]:
                batch_op.create_foreign_key(
                    constraint_name,
                    target_table,
                    [name],
                    [target_column],
                    ondelete="SET NULL",
                )


def _update_mysql_status_enum(add_value: bool) -> None:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return

    status_column = next(
        (
            column
            for column in sa.inspect(bind).get_columns("barangay_requests")
            if column["name"] == "status"
        ),
        None,
    )
    enum_values = getattr(status_column["type"], "enums", None) if status_column else None
    if not enum_values:
        return

    values = list(enum_values)
    if add_value and "Additional Requirements" not in values:
        values.append("Additional Requirements")
    elif not add_value and "Additional Requirements" in values:
        op.execute(
            sa.text(
                "UPDATE barangay_requests SET status = 'Pending' "
                "WHERE status = 'Additional Requirements'"
            )
        )
        values.remove("Additional Requirements")
    else:
        return

    escaped_values = [value.replace("'", "''") for value in values]
    values_sql = ", ".join(f"'{value}'" for value in escaped_values)
    op.execute(
        sa.text(
            "ALTER TABLE barangay_requests MODIFY COLUMN status "
            f"ENUM({values_sql}) NOT NULL DEFAULT 'Pending'"
        )
    )


def _drop_request_columns(
    column_names: tuple[str, ...], foreign_key_names: dict[str, str]
) -> None:
    existing_columns = _columns("barangay_requests")
    if not existing_columns:
        return

    foreign_keys = sa.inspect(op.get_bind()).get_foreign_keys("barangay_requests")
    to_drop = [
        foreign_key
        for foreign_key in foreign_keys
        if foreign_key.get("constrained_columns")
        and foreign_key["constrained_columns"][0] in foreign_key_names
    ]
    columns_to_drop = [name for name in column_names if name in existing_columns]
    if not to_drop and not columns_to_drop:
        return

    with op.batch_alter_table(
        "barangay_requests", naming_convention=FK_NAMING_CONVENTION
    ) as batch_op:
        for foreign_key in to_drop:
            column_name = foreign_key["constrained_columns"][0]
            constraint_name = foreign_key.get("name") or foreign_key_names[column_name]
            batch_op.drop_constraint(str(constraint_name), type_="foreignkey")
        for column_name in columns_to_drop:
            batch_op.drop_column(column_name)


def upgrade() -> None:
    if not sa.inspect(op.get_bind()).has_table("users"):
        raise RuntimeError("users must exist before adding request workflow fields.")

    _update_mysql_status_enum(add_value=True)
    _add_request_columns(
        {
            "processing_started_at": sa.DateTime(),
            "processing_by": sa.Integer(),
            "document_prepared_at": sa.DateTime(),
            "document_prepared_by": sa.Integer(),
            "document_signed_at": sa.DateTime(),
            "document_signed_by": sa.Integer(),
            "release_recipient_name": sa.String(length=255),
            "released_by": sa.Integer(),
        },
        {
            name: ("users", "user_id", constraint_name)
            for name, constraint_name in USER_FOREIGN_KEYS.items()
        },
    )

    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("barangay_request_documents"):
        if not inspector.has_table("barangay_requests"):
            raise RuntimeError(
                "barangay_requests must exist before creating request documents."
            )
        op.create_table(
            "barangay_request_documents",
            sa.Column(
                "request_document_id",
                _column_type("barangay_requests", "request_id"),
                autoincrement=True,
                nullable=False,
            ),
            sa.Column(
                "request_id",
                _column_type("barangay_requests", "request_id"),
                nullable=False,
            ),
            sa.Column(
                "uploaded_by", _column_type("users", "user_id"), nullable=True
            ),
            sa.Column(
                "purpose",
                sa.Enum(
                    *PURPOSE_VALUES,
                    name="barangay_request_document_purpose",
                    create_constraint=True,
                ),
                nullable=False,
            ),
            sa.Column("original_name", sa.String(length=255), nullable=False),
            sa.Column("storage_path", sa.String(length=255), nullable=False),
            sa.Column("mime_type", sa.String(length=100), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(
                ["request_id"],
                ["barangay_requests.request_id"],
                ondelete="CASCADE",
            ),
            sa.ForeignKeyConstraint(
                ["uploaded_by"], ["users.user_id"], ondelete="SET NULL"
            ),
            sa.PrimaryKeyConstraint("request_document_id"),
        )

    inspector = sa.inspect(op.get_bind())
    document_indexes = (
        inspector.get_indexes("barangay_request_documents")
        if inspector.has_table("barangay_request_documents")
        else []
    )
    if not any(
        index.get("column_names") == ["request_id", "purpose"]
        for index in document_indexes
    ):
        op.create_index(
            "barangay_request_documents_request_id_purpose_index",
            "barangay_request_documents",
            ["request_id", "purpose"],
            unique=False,
        )

    _add_request_columns(
        {
            "prepared_document_id": sa.Integer(),
            "signed_document_id": sa.Integer(),
        },
        {
            name: (
                "barangay_request_documents",
                "request_document_id",
                constraint_name,
            )
            for name, constraint_name in DOCUMENT_FOREIGN_KEYS.items()
        },
    )


def downgrade() -> None:
    _drop_request_columns(
        ("prepared_document_id", "signed_document_id"),
        DOCUMENT_FOREIGN_KEYS,
    )

    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("barangay_request_documents"):
        for index in inspector.get_indexes("barangay_request_documents"):
            if index.get("column_names") == ["request_id", "purpose"]:
                op.drop_index(index["name"], table_name="barangay_request_documents")
        op.drop_table("barangay_request_documents")

    _drop_request_columns(
        (
            "processing_started_at",
            "processing_by",
            "document_prepared_at",
            "document_prepared_by",
            "document_signed_at",
            "document_signed_by",
            "release_recipient_name",
            "released_by",
        ),
        USER_FOREIGN_KEYS,
    )
    _update_mysql_status_enum(add_value=False)
