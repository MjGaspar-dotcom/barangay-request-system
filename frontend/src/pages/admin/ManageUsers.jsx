import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";

const ROLE_FILTERS = [
    { value: "all", label: "All" },
    { value: "user", label: "Residents" },
    { value: "staff", label: "Staff" },
    { value: "admin", label: "Admins" },
];

const VERIFICATION_FILTERS = [
    { value: "all", label: "Any Status" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
];

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [busyUserId, setBusyUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/users");
            setUsers(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return users.filter((user) => {
            if (roleFilter !== "all" && user.role !== roleFilter) {
                return false;
            }

            if (verificationFilter !== "all") {
                if ((user.verification_status || "").toLowerCase() !==
                    verificationFilter) {
                    return false;
                }
            }

            if (needle) {
                const haystack = [
                    user.first_name,
                    user.middle_name,
                    user.last_name,
                    user.username,
                    user.email,
                    user.contact_number,
                    user.address,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(needle)) {
                    return false;
                }
            }

            return true;
        });
    }, [users, search, roleFilter, verificationFilter]);

    const flash = (message, isError = false) => {
        if (isError) {
            setActionError(message);
            setActionMessage("");
        } else {
            setActionMessage(message);
            setActionError("");
        }

        window.setTimeout(() => {
            setActionMessage("");
            setActionError("");
        }, 4000);
    };

    const handleVerificationUpdate = async (user, newStatus) => {
        const confirmAction = window.confirm(
            `Change verification status of ${user.first_name} ${user.last_name} to "${newStatus}"?`
        );
        if (!confirmAction) return;

        try {
            setBusyUserId(user.user_id);
            await api.patch(
                `/admin/users/${user.user_id}/verification`,
                { verification_status: newStatus }
            );
            flash(
                `Verification status updated to "${newStatus}" for ${user.first_name} ${user.last_name}.`
            );
            await fetchUsers();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message ||
                "Failed to update verification status.";
            flash(msg, true);
        } finally {
            setBusyUserId(null);
        }
    };

    const handleDelete = async (user) => {
        const confirmDelete = window.confirm(
            `Permanently delete ${user.first_name} ${user.last_name} (${user.username})? This cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            setBusyUserId(user.user_id);
            await api.delete(`/admin/users/${user.user_id}`);
            flash(
                `Account for ${user.first_name} ${user.last_name} has been deleted.`
            );
            await fetchUsers();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message ||
                "Failed to delete the account.";
            flash(msg, true);
        } finally {
            setBusyUserId(null);
        }
    };

    const fullName = (user) =>
        [user.first_name, user.middle_name, user.last_name]
            .filter(Boolean)
            .join(" ");

    const formatDate = (value) => {
        if (!value) return "—";
        return new Date(value).toLocaleString();
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading users...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <p>{error}</p>
                </div>
            </AdminLayout>
        );
    }

    const isResident = (user) => user.role === "user";

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                USER MANAGEMENT
                            </span>

                            <h1>Manage Users</h1>

                            <p>
                                Review resident accounts, update their
                                verification status, and remove accounts that
                                are no longer active.
                            </p>
                        </div>
                    </div>

                    {actionMessage && (
                        <div
                            className="alert alert-success"
                            role="alert"
                        >
                            {actionMessage}
                        </div>
                    )}

                    {actionError && (
                        <div className="alert alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

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
                                placeholder="Search by name, username, email, contact, address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                style={{ maxWidth: "360px", flex: "1 1 280px" }}
                            />

                            <select
                                className="form-select"
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(event.target.value)
                                }
                                style={{ maxWidth: "180px" }}
                            >
                                {ROLE_FILTERS.map((filter) => (
                                    <option
                                        key={filter.value}
                                        value={filter.value}
                                    >
                                        {filter.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select"
                                value={verificationFilter}
                                onChange={(event) =>
                                    setVerificationFilter(event.target.value)
                                }
                                style={{ maxWidth: "200px" }}
                            >
                                {VERIFICATION_FILTERS.map((filter) => (
                                    <option
                                        key={filter.value}
                                        value={filter.value}
                                    >
                                        Verification: {filter.label}
                                    </option>
                                ))}
                            </select>

                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
                            >
                                Showing {filtered.length} of {users.length}{" "}
                                user{users.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon">
                                    👥
                                </div>
                                <h3>No Users Found</h3>
                                <p>
                                    No accounts match your current filters.
                                    Try adjusting the search or filters above.
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
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Contact</th>
                                            <th>Role</th>
                                            <th>Verification</th>
                                            <th>Requests</th>
                                            <th>Created</th>
                                            <th style={{ minWidth: "220px" }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filtered.map((user) => (
                                            <tr key={user.user_id}>
                                                <td>
                                                    <strong>
                                                        {fullName(user)}
                                                    </strong>
                                                    <div
                                                        style={{
                                                            fontSize:
                                                                "12px",
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        {user.address || "—"}
                                                    </div>
                                                </td>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    {user.contact_number ||
                                                        "—"}
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        status={user.role}
                                                    />
                                                </td>
                                                <td>
                                                    {isResident(user) ? (
                                                        <StatusBadge
                                                            status={
                                                                user.verification_status ||
                                                                "pending"
                                                            }
                                                        />
                                                    ) : (
                                                        <span
                                                            style={{
                                                                color: "#9ca3af",
                                                            }}
                                                        >
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {user.total_requests ?? 0}
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        user.created_at
                                                    )}
                                                </td>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "6px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "verified" && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-success btn-sm"
                                                                    disabled={
                                                                        busyUserId ===
                                                                        user.user_id
                                                                    }
                                                                    onClick={() =>
                                                                        handleVerificationUpdate(
                                                                            user,
                                                                            "verified"
                                                                        )
                                                                    }
                                                                >
                                                                    Verify
                                                                </button>
                                                            )}

                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "rejected" && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    disabled={
                                                                        busyUserId ===
                                                                        user.user_id
                                                                    }
                                                                    onClick={() =>
                                                                        handleVerificationUpdate(
                                                                            user,
                                                                            "rejected"
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>
                                                            )}

                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "pending" && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    disabled={
                                                                        busyUserId ===
                                                                        user.user_id
                                                                    }
                                                                    onClick={() =>
                                                                        handleVerificationUpdate(
                                                                            user,
                                                                            "pending"
                                                                        )
                                                                    }
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}

                                                        {isResident(user) && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                disabled={
                                                                    busyUserId ===
                                                                    user.user_id
                                                                }
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        )}

                                                        {!isResident(user) && (
                                                            <span
                                                                style={{
                                                                    color: "#9ca3af",
                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                Managed in
                                                                Staff section
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
