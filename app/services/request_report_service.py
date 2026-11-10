from sqlalchemy import func

from app.extensions import db
from app.models.barangay_request import BarangayRequest
from app.models.document_type import DocumentType


class RequestReportService:
    @staticmethod
    def get_status_counts():
        rows = (
            db.session.query(BarangayRequest.status, func.count(BarangayRequest.id))
            .group_by(BarangayRequest.status)
            .all()
        )
        barangay = {status: count for status, count in rows}
        return {"barangay_requests": barangay, "total": sum(barangay.values())}

    @staticmethod
    def get_top_document_types(limit=5):
        rows = (
            db.session.query(DocumentType.document_name, func.count(BarangayRequest.id))
            .join(BarangayRequest, DocumentType.document_type_id == BarangayRequest.document_type_id)
            .group_by(DocumentType.document_name)
            .order_by(func.count(BarangayRequest.id).desc())
            .limit(limit)
            .all()
        )
        return [{"name": name, "total": total} for name, total in rows]

    @staticmethod
    def get_average_processing_time():
        average = (
            db.session.query(
                func.avg(
                    func.timestampdiff(
                         # SQLAlchemy maps this expression to database-specific HOUR units.
                        "hour",
                        BarangayRequest.created_at,
                        BarangayRequest.updated_at,
                    )
                )
            )
            .filter(BarangayRequest.status == "Completed")
            .filter(BarangayRequest.updated_at.isnot(None))
            .scalar()
        )
        return float(average or 0)