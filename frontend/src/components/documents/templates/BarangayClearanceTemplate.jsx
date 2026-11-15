import DocumentLetterhead from "../DocumentLetterhead";
import DocumentSignature from "../DocumentSignature";
import { formatDocumentDate } from "../utils/documentFormatters";
import "./BarangayClearanceTemplate.css";

export default function BarangayClearanceTemplate({ document }) {
    const { barangay, resident, request } = document;
    const roster = Array.isArray(barangay.council_roster)
        ? [...barangay.council_roster]
        : [];
    const punongBarangayName = barangay.punong_barangay_name;
    const hasPunongBarangay = roster.some((official) =>
        official.position?.toLowerCase().includes("punong barangay"),
    );
    if (
        punongBarangayName &&
        punongBarangayName !== "Not configured" &&
        !hasPunongBarangay
    ) {
        roster.unshift({
            name: punongBarangayName,
            position: "Punong Barangay",
        });
    }
    const secretary = roster.find((official) =>
        official.position?.toLowerCase().includes("secretary"),
    );
    const issuanceLocation = [
        barangay.barangay_name,
        barangay.municipality,
        barangay.province,
    ]
        .filter((value) => value && value !== "Not configured")
        .join(", ");

    return (
        <article
            className={`generated-document document-template-clearance ${
                document.is_synthetic_sample ? "document-synthetic-sample" : ""
            }`}
        >
            <div className="clearance-template-frame">
                <aside className="clearance-council-column">
                    <h2>Sangguniang Barangay</h2>
                    <div className="clearance-council-roster">
                        {roster.length ? (
                            roster.map((official, index) => (
                                <div
                                    className="clearance-council-official"
                                    key={`${official.position}-${index}`}
                                >
                                    <strong>{official.name}</strong>
                                    <span>{official.position}</span>
                                </div>
                            ))
                        ) : (
                            <p className="clearance-roster-empty">
                                Council roster not configured
                            </p>
                        )}
                    </div>
                </aside>

                <section className="clearance-certificate-column">
                    <DocumentLetterhead barangay={barangay} compact />
                    <p className="clearance-office-title">
                        Office of the Punong Barangay
                    </p>
                    <h1 className="document-title">
                        Certificate of Barangay Clearance
                    </h1>
                    <p className="document-salutation">
                        To Whom It May Concern:
                    </p>
                    <p className="clearance-certificate-intro">
                        This is to certify that
                    </p>
                    <p>
                        <strong>{resident.full_name}</strong>, {resident.age}{" "}
                        years old, {resident.civil_status}, is a bona fide
                        resident of <strong>{resident.address}</strong>,{" "}
                        {barangay.barangay_name}
                        {barangay.municipality &&
                        barangay.municipality !== "Not configured"
                            ? `, ${barangay.municipality}`
                            : ""}
                        {barangay.province &&
                        barangay.province !== "Not configured"
                            ? `, ${barangay.province}`
                            : ""}
                        .
                    </p>
                    <p>
                        This certification is issued upon the resident&apos;s
                        request for <strong>{request.purpose}</strong>.
                    </p>
                    <p className="document-issuance">
                        SIGNED and ISSUED this{" "}
                        {formatDocumentDate(document.issued_on)}
                        {issuanceLocation ? ` at ${issuanceLocation}` : ""}.
                    </p>

                    {secretary && (
                        <div className="clearance-secretary">
                            <strong>{secretary.name}</strong>
                            <span>Barangay Secretary</span>
                        </div>
                    )}

                    <DocumentSignature
                        barangay={barangay}
                        positionLabel="Barangay Captain"
                    />

                    <section
                        aria-label="Tax and thumbmark record"
                        className="clearance-tax-record"
                    >
                        <div className="clearance-tax-fields">
                            <p>Signature of Taxpayer: _____________________</p>
                            <p>Community Tax Certificate No.: _____________</p>
                            <p>Issued on: ________________________________</p>
                            <p>Issued at: _________________________________</p>
                            <p>Amount paid: ______________________________</p>
                        </div>
                        <div className="clearance-thumbmark">
                            <span>Right Thumbmark</span>
                        </div>
                    </section>
                </section>
            </div>
        </article>
    );
}
