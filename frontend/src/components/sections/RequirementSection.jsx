function RequirementSection() {
    const requirements = [
        {
            title: "Valid Government ID",
            description:
                "Prepare a valid identification document for verification.",
        },
        {
            title: "Proof of Residency",
            description:
                "Provide proof that establishes your residence when required.",
        },
        {
            title: "Complete Information",
            description:
                "Make sure your personal and request information is accurate.",
        },
        {
            title: "Supporting Documents",
            description:
                "Prepare any additional documents required for your request.",
        },
    ];

    return (
        <section className="content-section requirement-section">
            <div className="container">
                <div className="section-heading">
                    <span className="section-label">REQUIREMENTS</span>

                    <h2>Prepare Before You Request</h2>

                    <p>
                        Having the required information and documents ready
                        helps make the request process easier.
                    </p>
                </div>

                <div className="row g-4">
                    {requirements.map((requirement, index) => (
                        <div className="col-md-6" key={requirement.title}>
                            <div className="requirement-card">
                                <div className="requirement-number">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div>
                                    <h3>{requirement.title}</h3>

                                    <p>{requirement.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RequirementSection;
