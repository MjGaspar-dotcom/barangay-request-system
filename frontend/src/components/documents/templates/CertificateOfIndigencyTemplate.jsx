import DocumentLetterhead from "../DocumentLetterhead";
import DocumentMetadata from "../DocumentMetadata";
import DocumentResidentDetails from "../DocumentResidentDetails";
import DocumentSignature from "../DocumentSignature";
import DocumentFooter from "../DocumentFooter";
import { formatDocumentDate } from "../utils/documentFormatters";
import "./CertificateOfIndigencyTemplate.css";

export default function CertificateOfIndigencyTemplate({ document }) {
    const { barangay, resident, request } = document;

    return (
        <article className="generated-document document-template-indigency">
            <DocumentLetterhead barangay={barangay} />
            <DocumentMetadata document={document} />
            <h1 className="document-title">CERTIFICATE OF INDIGENCY</h1>
            <p className="document-salutation">TO WHOM IT MAY CONCERN:</p>
            <p>
                This is to certify that the person identified below has been
                assessed and verified as indigent by authorized personnel of{" "}
                {barangay.barangay_name}.
            </p>
            <DocumentResidentDetails resident={resident} />
            <p>
                This certification is issued upon the request of the above-named
                resident for the purpose stated below.
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
