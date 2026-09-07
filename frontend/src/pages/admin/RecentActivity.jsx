import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

const ACTION_FILTERS = [
    { value: "all", label: "All Actions" },
    { value: "created", label: "Created" },
    { value: "status_changed", label: "Status Changed" },
    { value: "verification_updated", label: "Verification Updated" },
    { value: "deleted", label: "Deleted" },
];

const PAGE_SIZE = 25;

export default function RecentActivity() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const fetchActivity = async (targetPage = page) => {
        try {
            setLoading(true);
            const params = {
                per_page: PAGE_SIZE,
                page: targetPage,
            };

            if (actionFilter !== "all") {
                params.action = actionFilter;
            }

            const response = await api.get("/admin/recent-activity", {
                params,
            });

            const payload = response.data.data;

            // Laravel paginate() returns: { data: [...], current_page, last_page, total, ... }
            // Some endpoints also return the array directly — support both.
            if (Array.isArray(payload)) {
                setLogs(payload);
                setMeta(null);
            } else {
                setLogs(payload?.data || []);
                setMeta(payload);
            }

            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load recent activity.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity(1);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionFilter]);

    const goToPage = (nextPage) => {
        if (!meta || nextPage < 1 || nextPage > meta.last_page) return;
        setPage(nextPage);
        fetchActivity(nextPage);
    };

    const actorName = (entry) => {
        if (entry.user) {
            return `${entry.user.first_name} ${entry.user.last_name}`;
        }
        if (entry.staff?.user) {
            return `${entry.staff.user.first_name} ${entry.staff.user.last_name}`;
        }
        return "System";
    };

    const actorRole = (entry) => {
        if (entry.staff) return "Staff";
        if (entry.user) return "User";
        return "System";
    };

    const formatDate = (value) => {
        if (!value) return "—";
        return new Date(value).toLocaleString();
    };

    const filtered = logs.filter((entry) => {
        if (!search) return true;
        const needle = search.toLowerCase();
        return [
            entry.description,
            entry.table_name,
            entry.action,
            actorName(entry),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle);
    });

    const actionIcon = (action) => {
        switch (action) {
            case "created":
                return "✚";
            case "deleted":
                return "✕";
            case "status_changed":
                return "⟳";
            case "verification_updated":
                return "✓";
            default:
                return "•";
        }
    };

    const actionColor = (action) => {
        switch (action) {
            case "created":
                return { bg: "#dcfce7", color: "#166534" };
            case "deleted":
                return { bg: "#fee2e2", color: "#991b1b" };
            case "status_changed":
                return { bg: "#dbeafe", color: "#1e40af" };
            case "verification_updated":
                return { bg: "#ede9fe", color: "#6d28d9" };
            default:
                return { bg: "#e5e7eb", color: "#374151" };
        }
    };

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                SYSTEM ACTIVITY
                            </span>

                            <h1>Recent Activity</h1>

                            <p>
                                A chronological log of every important action
                                performed on the system. Use the filters below
                                to narrow down by action type.
                            </p>
                        </div>
                    </div>

                    <section className="dashboard-section">
                        <div
                            className="admin-filters"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search descriptions, actors, table names..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                style={{
                                    maxWidth: "380px",
                                    flex: "1 1 280px",
                                }}
                            />

                            <select
                                className="form-select"
                                value={actionFilter}
                                onChange={(event) =>
                                    setActionFilter(event.target.value)
                                }
                                style={{ maxWidth: "240px" }}
                            >
                                {ACTION_FILTERS.map((filter) => (
                                    <option
                                        key={filter.value}
                                        value={filter.value}
                                    >
                                        {filter.label}
                                    </option>
                                ))}
                            </select>

                            {meta && (
                                <div
                                    style={{
                                        marginLeft: "auto",
                                        color: "#6b7280",
                                        fontSize: "14px",
                                    }}
                                >
                                    Page {meta.current_page} of{" "}
                                    {meta.last_page} • Total{" "}
                                    {meta.total} entries
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {loading ? (
                            <div className="page-loading">
                                <div
                                    className="spinner-border text-success"
                                    role="status"
                                >
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </div>
                                <p>Loading activity...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon">
                                    📊
                                </div>
                                <h3>No Activity Found</h3>
                                <p>
                                    No activity matches your current filters.
                                    Try a different action type or clear the
                                    search.
                                </p>
                            </div>
                        ) : (
                            <div
                                className="admin-table-wrapper"
                                style={{ overflowX: "auto" }}
                            >
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "50px" }}>
                                                Type
                                            </th>
                                            <th>Description</th>
                                            <th>Actor</th>
                                            <th>Target</th>
                                            <th>IP Address</th>
                                            <th>When</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filtered.map((entry) => {
                                            const color = actionColor(
                                                entry.action
                                            );

                                            return (
                                                <tr key={entry.audit_log_id}>
                                                    <td>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                width: "32px",
                                                                height: "32px",
                                                                borderRadius:
                                                                    "8px",
                                                                backgroundColor:
                                                                    color.bg,
                                                                color: color.color,
                                                                fontWeight: 700,
                                                            }}
                                                            title={entry.action}
                                                        >
                                                            {actionIcon(
                                                                entry.action
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <strong>
                                                            {entry.description ||
                                                                "—"}
                                                        </strong>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6b7280",
                                                                marginTop:
                                                                    "2px",
                                                            }}
                                                        >
                                                            Action:{" "}
                                                            <code>
                                                                {entry.action}
                                                            </code>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong>
                                                            {actorName(entry)}
                                                        </strong>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6b7280",
                                                            }}
                                                        >
                                                            {actorRole(entry)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code>
                                                            {entry.table_name}
                                                        </code>{" "}
                                                        #{entry.record_id}
                                                    </td>
                                                    <td>
                                                        {entry.ip_address ||
                                                            "—"}
                                                    </td>
                                                    <td>
                                                        {formatDate(
                                                            entry.created_at
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {meta && meta.last_page > 1 && (
                        <nav aria-label="Activity pagination">
                            <ul
                                className="pagination"
                                style={{
                                    display: "flex",
                                    gap: "6px",
                                    listStyle: "none",
                                    padding: 0,
                                }}
                            >
                                <li>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={page <= 1}
                                        onClick={() => goToPage(page - 1)}
                                    >
                                        ← Previous
                                    </button>
                                </li>

                                <li>
                                    <span
                                        style={{
                                            padding: "6px 12px",
                                            color: "#6b7280",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Page {page} of {meta.last_page}
                                    </span>
                                </li>

                                <li>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={page >= meta.last_page}
                                        onClick={() => goToPage(page + 1)}
                                    >
                                        Next →
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
