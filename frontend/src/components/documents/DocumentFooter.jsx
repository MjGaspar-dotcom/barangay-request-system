export default function DocumentFooter({ document }) {
    return (
        <footer className="document-footer">
            {document.official_receipt_information && (
                <p>
                    Official receipt: {document.official_receipt_information}
                </p>
            )}
            <p>
                Document No. {document.document_number} · Tracking No.{" "}
                {document.tracking_number}
            </p>
        </footer>
    );
}
