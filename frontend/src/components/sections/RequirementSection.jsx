export default function RequirementSection() {

    const requirements = [
        "Valid Government ID",
        "Proof of Residency",
        "Complete Personal Information",
        "Clear Photo of Required Documents"
    ];


    return (
        <section className="py-5 bg-light">

            <div className="container">

                <div className="text-center mb-5">

                    <h2 className="fw-bold">
                        Requirements
                    </h2>

                    <p className="text-muted">
                        Prepare the following requirements before submitting your request.
                    </p>

                </div>


                <div className="row justify-content-center">

                    <div className="col-lg-6">

                        <ul className="list-group shadow-sm">

                            {requirements.map((requirement, index) => (

                                <li
                                    className="list-group-item d-flex align-items-center"
                                    key={index}
                                >

                                    <span className="me-3 text-success">
                                        ✓
                                    </span>

                                    {requirement}

                                </li>

                            ))}

                        </ul>

                    </div>

                </div>

            </div>

        </section>
    );
}