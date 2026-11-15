import {
    canonicalRequestStatus,
    requestStatusLabel,
} from "../../utils/requestWorkflow";

/** Props: status, size. Maps existing status labels to shared semantic badge classes. */
const STATUS_CLASSES = {
    request_submitted: "pending",
    approved: "approved",
    rejected: "rejected",
    ready_for_pickup: "ready-for-pickup",
    completed: "completed",
    verified: "verified",
    pending: "pending",
    admin: "admin",
    staff: "staff",
    user: "user",
};

export default function StatusBadge({ status, size = "md" }) {
    const canonical = canonicalRequestStatus(status);
    if (canonical === "legacy_review") return null;

    const key = STATUS_CLASSES[canonical] || STATUS_CLASSES[String(status || "").toLowerCase()] || "default";

    return (
        <span
            className={`status-badge status-badge-${key} status-badge-${size === "sm" ? "sm" : "md"}`}
        >
            {requestStatusLabel(status)}
        </span>
    );
}
