import { Link } from "react-router-dom";

function HeroSection() {
    return (
        <section className="hero-section">
            <div className="container">
                <div className="row align-items-center g-5">
                    <div className="col-lg-7">
                        <span className="hero-label">
                            BARANGAY DIGITAL SERVICES
                        </span>

                        <h1>
                            Request Barangay Documents
                            <span> Online</span>
                        </h1>

                        <p className="hero-description">
                            A convenient and centralized platform for
                            requesting, processing, and tracking barangay
                            documents.
                        </p>

                        <div className="hero-actions">
                            <Link
                                to="/request"
                                className="btn btn-success btn-lg"
                            >
                                Request a Document
                            </Link>

                            <Link
                                to="/track-request"
                                className="btn btn-outline-success btn-lg"
                            >
                                Track Request
                            </Link>
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div className="hero-service-card">
                            <div className="hero-service-icon">📄</div>

                            <h2>Online Document Services</h2>

                            <p>
                                Submit requests and monitor their status through
                                one integrated system.
                            </p>

                            <div className="hero-service-list">
                                <div>
                                    <span>✓</span>
                                    Easy online requests
                                </div>

                                <div>
                                    <span>✓</span>
                                    Request tracking
                                </div>

                                <div>
                                    <span>✓</span>
                                    Organized processing
                                </div>

                                <div>
                                    <span>✓</span>
                                    Centralized records
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
