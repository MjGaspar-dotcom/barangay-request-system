export default function DocumentSignature({
    barangay,
    positionLabel = "Punong Barangay",
}) {
    return (
        <div className="document-signature">
            <div className="document-signature-line" />
            {barangay.punong_barangay_name &&
                barangay.punong_barangay_name !== "Not configured" && (
                    <strong>{barangay.punong_barangay_name}</strong>
                )}
            <span>{positionLabel}</span>
        </div>
    );
}
