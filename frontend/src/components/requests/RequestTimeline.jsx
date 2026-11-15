import { canonicalRequestStatus } from "../../utils/requestWorkflow";

const formatDate = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
};

export default function RequestTimeline({ request }) {
    const status = canonicalRequestStatus(request.status);
    if (status === "legacy_review") return null;

    const rejected = status === "rejected";
    const ready = ["ready_for_pickup", "completed"].includes(status);
    const completed = status === "completed";
    const processingComplete = [
        "approved",
        "ready_for_pickup",
        "completed",
        "rejected",
    ].includes(status);
    const submittedDate = request.created_at;
    const processingDate =
        request.approved_at || request.decision_at || request.document_prepared_at;
    const stages = [
        {
            key: "submitted",
            label: "Request Submitted",
            completed: true,
            date: submittedDate,
        },
        {
            key: "processing",
            label: rejected
                ? "Rejected"
                : processingComplete
                  ? "Approved"
                  : "Awaiting decision",
            completed: processingComplete,
            date: processingDate,
        },
        {
            key: "ready",
            label: "Ready for Pickup",
            completed: ready,
            date: request.ready_for_pickup_at,
        },
        {
            key: "completed",
            label: "Completed",
            completed,
            date: request.claimed_at,
        },
    ];

    return (
        <section className="admin-form-card">
            <h3 className="form-section-title">Request Progress</h3>
            {rejected && (
                <p className="app-alert app-alert-danger" role="status">
                    This request was rejected.
                </p>
            )}
            <ul className="timeline">
                {stages.map((stage) => {
                    const isCurrent =
                        !rejected &&
                        ((stage.key === "processing" &&
                            ["request_submitted", "approved"].includes(status)) ||
                            (stage.key === "ready" &&
                                ["approved", "ready_for_pickup"].includes(status)) ||
                            (stage.key === "completed" && status === "completed"));
                    const notApplicable =
                        rejected && ["ready", "completed"].includes(stage.key);

                    return (
                        <li
                            className={`timeline-item ${
                                stage.completed ? "done" : "pending"
                            }`}
                            key={stage.key}
                        >
                            <span className="timeline-dot" />
                            <div>
                                <strong>{stage.label}</strong>
                                <div className="timeline-date">
                                    {stage.completed
                                        ? formatDate(stage.date)
                                        : notApplicable
                                          ? "Not applicable — request rejected"
                                          : isCurrent
                                            ? "Current stage"
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
