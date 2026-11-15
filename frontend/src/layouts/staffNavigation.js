// Single source of truth for the staff sidebar.
export const STAFF_NAV_ITEMS = [
    {
        label: "Dashboard",
        group: "OVERVIEW",
        to: "/staff/dashboard",
        icon: "speedometer2",
    },
    {
        label: "System Analytics",
        group: "OVERVIEW",
        to: "/staff/analytics",
        icon: "bar-chart-line",
    },
    {
        label: "Manage Requests",
        group: "REQUESTS",
        to: "/staff/requests",
        icon: "clipboard-check",
        also: ["/staff/queue"],
    },
    {
        label: "Document Types",
        group: "REQUESTS",
        to: "/staff/document-types",
        icon: "file-earmark-text",
    },
    {
        label: "Recent Activity",
        group: "SYSTEM",
        to: "/staff/recent-activity",
        icon: "activity",
    },
];
