<<<<<<< HEAD
import React from "react";

const STATUS_STYLES = {
    Pending: { background: "#fef3c7", color: "#92400e" },
    Approved: { background: "#dbeafe", color: "#1e40af" },
    Processing: { background: "#ede9fe", color: "#6d28d9" },
    "Ready for Pickup": { background: "#d1fae5", color: "#065f46" },
    Completed: { background: "#dcfce7", color: "#166534" },
    Rejected: { background: "#fee2e2", color: "#991b1b" },
    verified: { background: "#dcfce7", color: "#166534" },
    pending: { background: "#fef3c7", color: "#92400e" },
    rejected: { background: "#fee2e2", color: "#991b1b" },
    admin: { background: "#ede9fe", color: "#6d28d9" },
    staff: { background: "#dbeafe", color: "#1e40af" },
    user: { background: "#e5e7eb", color: "#374151" },
};

const DEFAULT_STYLE = { background: "#e5e7eb", color: "#374151" };

export default function StatusBadge({ status, size = "md" }) {
    const key = status in STATUS_STYLES ? status : null;
    const style = key
        ? STATUS_STYLES[key]
        : STATUS_STYLES[String(status || "").toLowerCase()] || DEFAULT_STYLE;

    const padding = size === "sm" ? "2px 8px" : "4px 12px";
    const fontSize = size === "sm" ? "11px" : "12px";

    return (
        <span
            style={{
                display: "inline-block",
                padding,
                borderRadius: "999px",
                backgroundColor: style.background,
                color: style.color,
                fontSize,
                fontWeight: 600,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
            }}
=======
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
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        >
            {status}
        </span>
    );
}
