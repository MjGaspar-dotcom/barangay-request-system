/** Props: status, size. Maps existing status labels to shared semantic badge classes. */
const STATUS_CLASSES = {
    Pending: "pending",
    Approved: "approved",
    Processing: "processing",
    "Ready for Pickup": "ready-for-pickup",
    Completed: "completed",
    Rejected: "rejected",
    verified: "verified",
    pending: "pending",
    rejected: "rejected",
    admin: "admin",
    staff: "staff",
    user: "user",
};

export default function StatusBadge({ status, size = "md" }) {
    const key =
        status in STATUS_CLASSES
            ? STATUS_CLASSES[status]
            : STATUS_CLASSES[String(status || "").toLowerCase()] || "default";

    return (
        <span
            className={`status-badge status-badge-${key} status-badge-${size === "sm" ? "sm" : "md"}`}
        >
            {status}
        </span>
    );
}
