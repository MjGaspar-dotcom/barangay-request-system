function AboutSection() {
    return (
        <section id="about" className="content-section about-section">
            <div className="container">
                <div className="section-heading">
                    <span className="section-label">ABOUT THE SYSTEM</span>

                    <h2>Integrated Barangay Document Services</h2>

                    <p>
                        The Integrated Barangay Document Request, Processing,
                        and Analytics System provides a centralized platform for
                        requesting and processing barangay documents.
                    </p>
                </div>

                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="info-card">
                            <h3>Request Online</h3>
                            <p>
                                Residents can submit document requests without
                                having to manually complete the entire process
                                at the barangay office.
                            </p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="info-card">
                            <h3>Track Requests</h3>
                            <p>
                                Each request receives a tracking number so users
                                can monitor its processing status.
                            </p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="info-card">
                            <h3>Data Analytics</h3>
                            <p>
                                Barangay personnel can use collected request
                                data to monitor activity and support data-driven
                                decision-making.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AboutSection;
