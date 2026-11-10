const formatDate = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
};

export default function RequestTimeline({ request }) {
    const history = request.history || [];
    const resubmissionEvent = [...history]
        .reverse()
        .find((event) => event.action === "requirements_resubmitted");
    const decisionEvent = [...history]
        .reverse()
        .find(
            (event) =>
                (!resubmissionEvent ||
                    new Date(event.created_at) >
                        new Date(resubmissionEvent.created_at)) &&
                event.new_values?.status &&
                ["Approved", "Additional Requirements", "Rejected"].includes(
                    event.new_values.status,
                ),
        );

    let currentStage = "requirements";
    if (request.status === "Pending" && request.verified_at) {
        currentStage = "decision";
    } else if (request.status === "Additional Requirements") {
        currentStage = "resubmission";
    } else if (request.status === "Approved") {
        currentStage = "processing";
    } else if (request.status === "Processing") {
        currentStage = request.document_prepared_at
            ? request.document_signed_at
                ? "ready"
                : "authorization"
            : "preparation";
    } else if (request.status === "Ready for Pickup") {
        currentStage = "release";
    }

    const timeline = [
        {
            key: "submitted",
            label: "Submitted",
            completed: true,
            date: request.created_at,
        },
        {
            key: "requirements",
            label: "Requirements verified",
            completed: Boolean(request.verified_at),
            date: request.verified_at,
        },
        {
            key: "decision",
            label: "Administrative decision",
            completed: Boolean(decisionEvent),
            date: decisionEvent?.created_at,
        },
        {
            key: "resubmission",
            label: "Resident resubmission",
            completed: Boolean(resubmissionEvent),
            date: resubmissionEvent?.created_at,
            applicable:
                request.status === "Additional Requirements" ||
                Boolean(resubmissionEvent),
        },
        {
            key: "processing",
            label: "Processing started",
            completed: Boolean(request.processing_started_at),
            date: request.processing_started_at,
        },
        {
            key: "preparation",
            label: "Document prepared and checked",
            completed: Boolean(request.document_prepared_at),
            date: request.document_prepared_at,
        },
        {
            key: "authorization",
            label: "Authorized and signed",
            completed: Boolean(request.document_signed_at),
            date: request.document_signed_at,
        },
        {
            key: "ready",
            label: "Ready for Pickup",
            completed: Boolean(request.ready_for_pickup_at),
            date: request.ready_for_pickup_at,
        },
        {
            key: "release",
            label: "Released / Completed",
            completed: Boolean(request.claimed_at),
            date: request.claimed_at,
        },
    ];

    return (
        <section className="admin-form-card">
            <h3 className="form-section-title">Processing Timeline</h3>
            <ul className="timeline">
                {timeline.map((step) => {
                    const isCurrent =
                        step.key === currentStage && !step.completed;
                    const notApplicable =
                        request.status === "Rejected" &&
                        [
                            "resubmission",
                            "processing",
                            "preparation",
                            "authorization",
                            "ready",
                            "release",
                        ].includes(step.key);
                    const notRequired = step.applicable === false;

                    return (
                        <li
                            className={`timeline-item ${
                                step.completed ? "done" : "pending"
                            }`}
                            key={step.key}
                        >
                            <span className="timeline-dot" />
                            <div>
                                <strong>{step.label}</strong>
                                <div className="timeline-date">
                                    {step.completed
                                        ? formatDate(step.date)
                                        : notApplicable
                                          ? "Not applicable — request rejected"
                                          : notRequired
                                            ? "Not required"
                                            : isCurrent
                                              ? "Current step"
                                              : "Upcoming"}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
