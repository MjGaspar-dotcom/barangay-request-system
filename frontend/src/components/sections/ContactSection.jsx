function ContactSection() {
    return (
        <section id="contact" className="content-section contact-section">
            <div className="container">
                <div className="section-heading">
                    <span className="section-label">CONTACT</span>

                    <h2>Barangay Office</h2>

                    <p>
                        For concerns regarding document requests, processing, or
                        other barangay services, contact the barangay office.
                    </p>
                </div>

                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="contact-card">
                            <h3>Address</h3>
                            <p>
                                Barangay Hall
                                <br />
                                San Juan, Ilocos Sur
                            </p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="contact-card">
                            <h3>Contact Number</h3>
                            <p>Contact the barangay office for assistance.</p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="contact-card">
                            <h3>Office Hours</h3>
                            <p>
                                Monday–Friday
                                <br />
                                8:00 AM–5:00 PM
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ContactSection;
