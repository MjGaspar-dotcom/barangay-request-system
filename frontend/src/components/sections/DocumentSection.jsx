import { useNavigate } from "react-router-dom";

function DocumentSection() {
    const navigate = useNavigate();

    const documents = [
        {
            title: "Barangay Clearance",
            description:
                "A certification commonly required for employment, business, school, and other official transactions.",
        },
        {
            title: "Certificate of Residency",
            description:
                "A document certifying that an individual is a resident of the barangay.",
        },
        {
            title: "Certificate of Indigency",
            description:
                "A certification used to establish an individual's indigency for applicable purposes.",
        },
        {
            title: "Business Clearance",
            description:
                "A barangay-level clearance used as part of business registration and related transactions.",
        },
    ];

    return (
        <section id="services" className="content-section document-section">
            <div className="container">
                <div className="section-heading">
                    <span className="section-label">DOCUMENT SERVICES</span>

                    <h2>Available Documents</h2>

                    <p>
                        Request common barangay documents through the online
                        document request system.
                    </p>
                </div>

                <div className="row g-4">
                    {documents.map((document) => (
                        <div className="col-md-6 col-lg-3" key={document.title}>
                            <div className="document-card">
                                <h3>{document.title}</h3>

                                <p>{document.description}</p>

                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => navigate("/request")}
                                >
                                    Request Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default DocumentSection;
