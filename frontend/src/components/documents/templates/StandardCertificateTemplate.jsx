import DocumentFooter from "../DocumentFooter";
import DocumentLetterhead from "../DocumentLetterhead";
import DocumentMetadata from "../DocumentMetadata";
import DocumentResidentDetails from "../DocumentResidentDetails";
import DocumentSignature from "../DocumentSignature";
import { formatDocumentDate } from "../utils/documentFormatters";
import "./StandardCertificateTemplate.css";

export default function StandardCertificateTemplate({ document }) {
    const { barangay, resident, request } = document;

    return (
        <article className="generated-document document-template-standard-certificate">
            <DocumentLetterhead barangay={barangay} />
            <DocumentMetadata document={document} />
            <h1 className="document-title">{document.document_type}</h1>
            <p className="document-salutation">TO WHOM IT MAY CONCERN:</p>
            <p className="standard-certificate-copy">
                This certifies the issuance of this {document.document_type} to{" "}
                {resident.full_name} by the Office of the Punong Barangay.
            </p>
            <DocumentResidentDetails resident={resident} />
            <p className="document-purpose">
                Issued upon the request of the above-named resident for the
                purpose stated below.
            </p>
            <p className="document-purpose">
                <strong>Purpose:</strong> {request.purpose}
            </p>
            <p className="document-issuance">
                Issued this {formatDocumentDate(document.issued_on)} at{" "}
                {barangay.barangay_name}, {barangay.municipality},{" "}
                {barangay.province}.
            </p>
            <DocumentSignature barangay={barangay} />
            <DocumentFooter document={document} />
        </article>
    );
}
