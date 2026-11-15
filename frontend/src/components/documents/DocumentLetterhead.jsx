import api from "../../services/api";

export default function DocumentLetterhead({ barangay, compact = false }) {
    const apiBase = api.defaults.baseURL.replace(/\/api\/?$/, "");
    return (
        <header
            className={`document-letterhead ${
                compact ? "document-letterhead-compact" : ""
            } ${
                barangay.seal_path ? "" : "document-letterhead-no-seal"
            }`}
        >
            {barangay.seal_path && (
                <img
                    alt={`${barangay.barangay_name} official seal`}
                    className="document-seal"
                    src={`${apiBase}/storage/${barangay.seal_path}`}
                />
            )}
            <div className="document-letterhead-copy">
                <p>Republic of the Philippines</p>
                {barangay.province &&
                    barangay.province !== "Not configured" && (
                        <p>Province of {barangay.province}</p>
                    )}
                {barangay.municipality &&
                    barangay.municipality !== "Not configured" && (
                        <p>Municipality/City of {barangay.municipality}</p>
                    )}
                <h2>{barangay.barangay_name}</h2>
                <p>Office of the Punong Barangay</p>
                {barangay.office_address && <p>{barangay.office_address}</p>}
                {barangay.contact_information && (
                    <p>{barangay.contact_information}</p>
                )}
            </div>
        </header>
    );
}
