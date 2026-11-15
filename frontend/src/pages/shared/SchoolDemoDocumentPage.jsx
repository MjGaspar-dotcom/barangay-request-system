import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import DocumentPreview from "../../components/documents/DocumentPreview";
import { documentTemplateIdentifierForType } from "../../components/documents/utils/documentTemplateRegistry";
import "./request-processing.css";

const SCHOOL_DEMO_DOCUMENT = {
    template_identifier: "barangay_clearance",
    template_version: "1.0",
    document_number: "DEMO-BR-0001",
    tracking_number: "DEMO-TRACKING-0001",
    document_type: "Barangay Clearance",
    issued_on: "2026-11-12",
    is_preview: true,
    is_synthetic_sample: true,
    resident: {
        full_name: "Jamie Demo Resident",
        birth_date: "2000-01-15",
        age: 26,
        civil_status: "Single",
        address: "123 Example Street, Barangay Demo",
    },
    request: {
        purpose: "School project demonstration only",
    },
    barangay: {
        barangay_name: "Barangay Demo",
        municipality: "Example Municipality",
        province: "Sample Province",
        punong_barangay_name: "Alex Example",
        seal_path: null,
        office_address: "1 Demo Road, Barangay Demo",
        contact_information: "(000) 000-0000",
        council_roster: [
            { name: "Jordan Sample", position: "Sangguniang Barangay Member" },
            { name: "Taylor Example", position: "Sangguniang Barangay Member" },
            { name: "Morgan Sample", position: "Sangguniang Barangay Member" },
            { name: "Avery Example", position: "Sangguniang Barangay Member" },
            { name: "Drew Sample", position: "Sangguniang Barangay Member" },
            { name: "Robin Example", position: "Sangguniang Barangay Member" },
            { name: "Cameron Sample", position: "SK Chairperson" },
            { name: "Riley Demo", position: "Barangay Secretary" },
            { name: "Casey Sample", position: "Barangay Treasurer" },
        ],
    },
    official_receipt_information: null,
};

export default function SchoolDemoDocumentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const Layout = isAdmin ? AdminLayout : StaffLayout;
    const defaultBackPath = isAdmin ? "/admin/barangay-settings" : "/staff/requests";
    const returnPath = location.state?.from;
    const selectedDocumentType = location.state?.documentType;
    const sampleDocument = selectedDocumentType
        ? {
              ...SCHOOL_DEMO_DOCUMENT,
              document_type: selectedDocumentType.document_name,
              template_description: selectedDocumentType.description,
              template_identifier: documentTemplateIdentifierForType(
                  selectedDocumentType.document_name,
              ),
          }
        : SCHOOL_DEMO_DOCUMENT;
    const backPath =
        typeof returnPath === "string" &&
        returnPath.startsWith(isAdmin ? "/admin/" : "/staff/")
            ? returnPath
            : defaultBackPath;

    return (
        <Layout>
            <div className="admin-dashboard generated-document-page">
                <div className="w-full">
                    <header className="generated-document-toolbar document-preview-toolbar">
                        <div>
                            <span className="section-label">
                                DOCUMENT TEMPLATE
                            </span>
                            <h1>
                                Example:{" "}
                                {sampleDocument.document_type}
                            </h1>
                            <p>
                                This preview uses fictional data and is not an
                                official document.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                className="app-button app-button-outline-secondary"
                                onClick={() => navigate(backPath)}
                                type="button"
                            >
                                Back
                            </Button>
                            <Button
                                className="app-button app-button-primary"
                                onClick={() => window.print()}
                                type="button"
                            >
                                Print Demo
                            </Button>
                        </div>
                    </header>

                    <div className="app-alert app-alert-warning document-preview-toolbar" role="note">
                        SAMPLE ONLY - Names, identifiers, address, and barangay
                        details below are synthetic and must not be used for
                        official requests.
                    </div>

                    <DocumentPreview document={sampleDocument} />
                </div>
            </div>
        </Layout>
    );
}
