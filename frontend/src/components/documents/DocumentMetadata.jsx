import { formatDocumentDate } from "./utils/documentFormatters";

export default function DocumentMetadata({ document }) {
    return (
        <div className="document-metadata">
            <span>
                <strong>Document No.:</strong> {document.document_number}
            </span>
            <span>
                <strong>Tracking No.:</strong> {document.tracking_number}
            </span>
            <span>
                <strong>{document.is_preview ? "Preview date:" : "Date issued:"}</strong>{" "}
                {formatDocumentDate(document.issued_on)}
            </span>
        </div>
    );
}
