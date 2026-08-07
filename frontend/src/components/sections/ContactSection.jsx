export default function ContactSection() {
    return (
        <section className="py-5">

            <div className="container">

                <div className="text-center mb-5">

                    <h2 className="fw-bold">
                        Contact Us
                    </h2>

                    <p className="text-muted">
                        Have questions? Contact your barangay office.
                    </p>

                </div>


                <div className="row justify-content-center">

                    <div className="col-lg-8">

                        <div className="card shadow-sm border-0">

                            <div className="card-body">

                                <div className="row text-center">

                                    <div className="col-md-4 mb-3">

                                        <h5>
                                            Address
                                        </h5>

                                        <p className="text-muted">
                                            Barangay Office Address
                                        </p>

                                    </div>


                                    <div className="col-md-4 mb-3">

                                        <h5>
                                            Contact Number
                                        </h5>

                                        <p className="text-muted">
                                            09XX-XXX-XXXX
                                        </p>

                                    </div>


                                    <div className="col-md-4 mb-3">

                                        <h5>
                                            Office Hours
                                        </h5>

                                        <p className="text-muted">
                                            Monday - Friday
                                            <br />
                                            8:00 AM - 5:00 PM
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
}   