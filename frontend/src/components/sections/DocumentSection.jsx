export default function DocumentSection() {

    const documents = [
        {
            title: "Barangay Clearance",
            description:
                "A certification issued by the barangay for employment, business, and other purposes."
        },
        {
            title: "Certificate of Residency",
            description:
                "Proof that a resident is currently living within the barangay."
        },
        {
            title: "Certificate of Indigency",
            description:
                "A document certifying that a person belongs to a low-income household."
        },
        {
            title: "Business Clearance",
            description:
                "A clearance required for businesses operating within the barangay."
        }
    ];


    return (
        <section className="py-5">

            <div className="container">

                <div className="text-center mb-5">

                    <h2 className="fw-bold">
                        Available Documents
                    </h2>

                    <p className="text-muted">
                        Request your barangay documents online.
                    </p>

                </div>


                <div className="row">

                    {documents.map((document, index) => (

                        <div 
                            className="col-md-6 col-lg-3 mb-4"
                            key={index}
                        >

                            <div className="card h-100 shadow-sm border-0">

                                <div className="card-body text-center">

                                    <h5 className="card-title fw-bold">
                                        {document.title}
                                    </h5>


                                    <p className="card-text text-muted">
                                        {document.description}
                                    </p>


                                    <button className="btn btn-primary">
                                        Request Now
                                    </button>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </section>
    );
}