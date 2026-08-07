import { Link } from "react-router-dom";
export default function HeroSection() {
    return (
        <section className="bg-light py-5">
            <div className="container">

                <div className="row align-items-center">

                    <div className="col-lg-7">

                        <h1 className="display-4 fw-bold">
                            Barangay Document Request System
                        </h1>

                        <p className="lead mt-3">
                            Request your barangay documents online
                            faster, easier, and more convenient.
                        </p>

                        <div className="mt-4">

                            <Link
                                to="/request"
                                className="btn btn-primary btn-lg me-3"
                            >
                                     Request Document
                            </Link>
                            <Link
                                    to="/track-request"
                                    className="btn btn-outline-primary btn-lg"
                                >
                                    Track Request
                            </Link>

                        </div>

                    </div>


                    <div className="col-lg-5 text-center mt-4 mt-lg-0">

                        <div className="card shadow border-0 p-4">

                            <h3>
                                Online Services
                            </h3>

                            <p className="text-muted">
                                Access barangay documents
                                anytime and anywhere.
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        </section>
    );
}