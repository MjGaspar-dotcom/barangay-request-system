// Single source of truth for the staff sidebar.
export const STAFF_NAV_ITEMS = [
    { label: "Dashboard", to: "/staff/dashboard", icon: "speedometer2" },
    {
        label: "Request Queue",
        to: "/staff/queue",
        icon: "clipboard-check",
        also: ["/staff/requests"],
    },
    {
        label: "System Analytics",
        to: "/staff/reports",
        icon: "bar-chart-line",
    },
];
