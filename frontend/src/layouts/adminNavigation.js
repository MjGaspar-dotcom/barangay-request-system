export const ADMIN_NAV_ITEMS = [
    {
        label: "Dashboard",
        group: "OVERVIEW",
        to: "/admin/dashboard",
        icon: "speedometer2",
    },
    {
        label: "System Analytics",
        group: "OVERVIEW",
        to: "/admin/analytics",
        icon: "bar-chart-line",
    },
    {
        label: "Manage Requests",
        group: "REQUESTS",
        to: "/admin/requests",
        icon: "clipboard-check",
    },
    {
        label: "Document Types",
        group: "REQUESTS",
        to: "/admin/document-types",
        icon: "file-earmark-text",
    },
    {
        label: "Document Templates",
        group: "REQUESTS",
        to: "/admin/document-templates",
        icon: "file-earmark-text",
    },
    {
        label: "Programs & Recommendations",
        group: "COMMUNITY",
        to: "/admin/recommendations",
        icon: "activity",
        mobileOnly: true,
    },
    {
        label: "Manage Users",
        group: "PEOPLE",
        to: "/admin/users",
        icon: "users",
    },
    {
        label: "Manage Staff",
        group: "PEOPLE",
        to: "/admin/staff",
        icon: "person-badge",
    },
    {
        label: "Recent Activity",
        group: "SYSTEM",
        to: "/admin/recent-activity",
        icon: "activity",
    },
];
