export const REQUEST_STATUS_OPTIONS = [
    { value: "all", label: "All stages" },
    { value: "request_submitted", label: "Request Submitted" },
    { value: "rejected", label: "Rejected" },
    { value: "ready_for_pickup", label: "Ready for Pickup" },
    { value: "completed", label: "Completed" },
];

const LEGACY_STATUS_MAP = {
    pending: "request_submitted",
    approved: "approved",
    rejected: "rejected",
    "ready for pickup": "ready_for_pickup",
    completed: "completed",
    migration_review: "legacy_review",
    processing: "legacy_review",
    "additional requirements": "legacy_review",
};

const STATUS_LABELS = {
    request_submitted: "Request Submitted",
    approved: "Approved",
    rejected: "Rejected",
    ready_for_pickup: "Ready for Pickup",
    completed: "Completed",
};

export function canonicalRequestStatus(status) {
    if (typeof status !== "string") return "unknown";
    return LEGACY_STATUS_MAP[status] ||
        LEGACY_STATUS_MAP[status.toLowerCase()] ||
        status;
}

export function isInCurrentWorkflow(request) {
    return canonicalRequestStatus(request?.status) !== "legacy_review";
}

export function requestStatusLabel(status) {
    const canonical = canonicalRequestStatus(status);
    return STATUS_LABELS[canonical] || status || "Unknown";
}
