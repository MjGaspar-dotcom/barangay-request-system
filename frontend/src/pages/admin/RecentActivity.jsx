import { useState } from "react";
import Table from "react-bootstrap/Table";
import AdminLayout from "../../layouts/AdminLayout";

const ACTION_FILTERS = [
    { value: "all", label: "All Actions" },
    { value: "created", label: "Created" },
    { value: "status_changed", label: "Status Changed" },
    { value: "verification_updated", label: "Verification Updated" },
    { value: "deleted", label: "Deleted" },
];

export default function RecentActivity() {
    const logs = [];
    const meta = null;
    const loading = false;
    const error =
        "Recent activity is unavailable because the API does not provide an audit-log endpoint.";
    const [actionFilter, setActionFilter] = useState("all");
    const [search, setSearch] = useState("");

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
            <div className="admin-dashboard recent-activity-page">
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
                        <div className="admin-filters filter-bar">
                            <input
                                type="search"
                                placeholder="Search descriptions, actors, table names..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="form-control filter-search"
                            />

                            <select
                                value={actionFilter}
                                onChange={(event) =>
                                    setActionFilter(event.target.value)
                                }
                                className="form-select filter-select"
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
                                <div className="filter-summary">
                                    Page {meta.current_page} of{" "}
                                    {meta.last_page} • Total{" "}
                                    {meta.total} entries
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {loading ? (
                            <div className="page-loading" role="status">
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
                        ) : error ? (
                            <div className="alert alert-info" role="status">
                                {error}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon"><i className="bi bi-activity" aria-hidden="true" /></div>
                                <h3>No Activity Found</h3>
                                <p>
                                    No activity matches your current filters.
                                    Try a different action type or clear the
                                    search.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-table-wrapper table-scroll">
                                <Table className="admin-table data-table recent-activity-table">
                                    <colgroup>
                                        <col className="activity-type-column" />
                                        <col className="activity-description-column" />
                                        <col className="activity-actor-column" />
                                        <col className="activity-target-column" />
                                        <col className="activity-ip-column" />
                                        <col className="activity-when-column" />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th className="activity-type-heading">
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
                                                            className="activity-type-icon"
                                                            style={{ "--activity-bg": color.bg, "--activity-color": color.color }}
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
                                                        <div className="table-meta-text">
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
                                                        <div className="table-meta-text">
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
                                </Table>
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </AdminLayout>
    );
}
