// Single source of truth for the staff sidebar.
export const STAFF_NAV_ITEMS = [
    { label: "Dashboard", to: "/staff/dashboard", icon: "bi-speedometer2" },
    {
        label: "Request Queue",
        to: "/staff/queue",
        icon: "bi-clipboard-check",
        also: ["/staff/requests"],
    },
    {
        label: "Request Reports",
        to: "/staff/reports",
        icon: "bi-bar-chart-line",
    },
];
