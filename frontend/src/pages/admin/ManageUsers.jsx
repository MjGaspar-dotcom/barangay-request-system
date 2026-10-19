import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
=======
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

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
<<<<<<< HEAD
    const [actionError, setActionError] = useState("");
    const [busyUserId, setBusyUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
=======
    const [actionMessageType, setActionMessageType] = useState("success");
    const [actionError, setActionError] = useState("");
    const [busyUserId, setBusyUserId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Initial page load shows the full-page loader. Refreshes after actions
    // happen silently so the table stays visible and the screen does not flash.
    const fetchUsers = async ({ background = false } = {}) => {
        try {
            if (!background) setLoading(true);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
            const response = await api.get("/admin/users");
            setUsers(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
<<<<<<< HEAD
            setError("Failed to load users.");
        } finally {
            setLoading(false);
=======
            if (!background) {
                setError("Failed to load users. Please refresh the page and try again.");
            } else {
                flash("The action succeeded, but the user list could not be refreshed. Please refresh the page.", true);
            }
        } finally {
            if (!background) setLoading(false);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
    const flash = (message, isError = false) => {
=======
    const flash = (message, isError = false, messageType = "success") => {
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        if (isError) {
            setActionError(message);
            setActionMessage("");
        } else {
            setActionMessage(message);
<<<<<<< HEAD
=======
            setActionMessageType(messageType);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
            setActionError("");
        }

        window.setTimeout(() => {
            setActionMessage("");
            setActionError("");
        }, 4000);
    };

    const handleVerificationUpdate = async (user, newStatus) => {
<<<<<<< HEAD
        const confirmAction = window.confirm(
            `Change verification status of ${user.first_name} ${user.last_name} to "${newStatus}"?`
        );
        if (!confirmAction) return;

=======
        const name = fullName(user);
        setConfirmDialog({
            title: newStatus === "rejected"
                ? "Reject user verification"
                : "Confirm verification update",
            message: newStatus === "rejected"
                ? `Reject the verification for ${name}? The user will remain unable to access verified services.`
                : `Update the verification status for ${name} to ${newStatus}?`,
            confirmLabel: newStatus === "rejected" ? "Reject verification" : `Set ${newStatus}`,
            variant: newStatus === "rejected" ? "danger" : "primary",
            onConfirm: () => runVerificationUpdate(user, newStatus),
        });
    };

    const runVerificationUpdate = async (user, newStatus) => {
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        try {
            setBusyUserId(user.user_id);
            await api.patch(
                `/admin/users/${user.user_id}/verification`,
                { verification_status: newStatus }
            );
            flash(
<<<<<<< HEAD
                `Verification status updated to "${newStatus}" for ${user.first_name} ${user.last_name}.`
            );
            await fetchUsers();
=======
                `Verification for ${fullName(user)} was ${newStatus === "rejected" ? "rejected" : `updated to ${newStatus}`}.`,
                false,
                newStatus === "rejected" ? "danger" : "success",
            );
            await fetchUsers({ background: true });
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
        const confirmDelete = window.confirm(
            `Permanently delete ${user.first_name} ${user.last_name} (${user.username})? This cannot be undone.`
        );
        if (!confirmDelete) return;

=======
        const name = fullName(user);
        setConfirmDialog({
            title: "Delete user account",
            message: `Permanently delete the account for ${name} (${user.username})? This action cannot be undone.`,
            confirmLabel: "Delete account",
            variant: "danger",
            onConfirm: () => runDelete(user),
        });
    };

    const runDelete = async (user) => {
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        try {
            setBusyUserId(user.user_id);
            await api.delete(`/admin/users/${user.user_id}`);
            flash(
<<<<<<< HEAD
                `Account for ${user.first_name} ${user.last_name} has been deleted.`
            );
            await fetchUsers();
=======
                `The account for ${fullName(user)} was deleted successfully.`,
                false,
                "danger",
            );
            await fetchUsers({ background: true });
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                    <p>{error}</p>
=======
                    <div className="alert alert-danger" role="alert">{error}</div>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                </div>
            </AdminLayout>
        );
    }

    const isResident = (user) => user.role === "user";

    return (
        <AdminLayout>
<<<<<<< HEAD
            <div className="admin-dashboard">
=======
            <div className="admin-dashboard manage-users-page">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                            className="alert alert-success"
                            role="alert"
                        >
                            {actionMessage}
=======
                            className={`alert alert-${actionMessageType} manage-users-feedback`}
                            role="status"
                            aria-live="polite"
                        >
                            <i
                                className={`bi ${actionMessageType === "danger" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"}`}
                                aria-hidden="true"
                            />
                            <span>{actionMessage}</span>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        </div>
                    )}

                    {actionError && (
                        <div className="alert alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

                    <section className="dashboard-section">
                        <div
<<<<<<< HEAD
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
=======
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="form-control filter-search-360"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                placeholder="Search by name, username, email, contact, address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "360px", flex: "1 1 280px" }}
                            />

                            <select
                                className="form-select"
=======
                                
                            />

                            <select
                                className="form-select filter-select-180"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "180px" }}
=======
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                className="form-select"
=======
                                className="form-select filter-select-200"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                value={verificationFilter}
                                onChange={(event) =>
                                    setVerificationFilter(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "200px" }}
=======
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
=======
                            <div className="filter-count"
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            >
                                Showing {filtered.length} of {users.length}{" "}
                                user{users.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
<<<<<<< HEAD
                                <div className="dashboard-empty-icon">
                                    👥
=======
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <i className="bi bi-people" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                </div>
                                <h3>No Users Found</h3>
                                <p>
                                    No accounts match your current filters.
                                    Try adjusting the search or filters above.
                                </p>
                            </div>
                        ) : (
                            <div
<<<<<<< HEAD
                                className="admin-table-wrapper"
                                style={{ overflowX: "auto" }}
                            >
                                <table className="admin-table">
=======
                                className="table-scroll admin-table-wrapper u-scroll-x"
                                
                            >
                                <Table className="admin-table data-table manage-users-table">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                            <th style={{ minWidth: "220px" }}>
=======
                                            <th className="manage-users-actions-heading">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                    <div
                                                        style={{
                                                            fontSize:
                                                                "12px",
                                                            color: "#6b7280",
                                                        }}
=======
                                                    <div className="text-muted-sm"
                                                        
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                        <span
                                                            style={{
                                                                color: "#9ca3af",
                                                            }}
=======
                                                        <span className="text-faint"
                                                            
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "6px",
                                                            flexWrap: "wrap",
                                                        }}
=======
                                                <td className="manage-users-actions-cell">
                                                    <div className="action-row-tight manage-users-actions"
                                                        
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                    >
                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "verified" && (
<<<<<<< HEAD
                                                                <button
=======
                                                                <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                                </button>
=======
                                                                </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            )}

                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "rejected" && (
<<<<<<< HEAD
                                                                <button
=======
                                                                <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                                </button>
=======
                                                                </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            )}

                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "pending" && (
<<<<<<< HEAD
                                                                <button
=======
                                                                <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                                </button>
                                                            )}

                                                        {isResident(user) && (
                                                            <button
=======
                                                                </Button>
                                                            )}

                                                        {isResident(user) && (
                                                            <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                            </button>
                                                        )}

                                                        {!isResident(user) && (
                                                            <span
                                                                style={{
                                                                    color: "#9ca3af",
                                                                    fontSize:
                                                                        "12px",
                                                                }}
=======
                                                            </Button>
                                                        )}

                                                        {!isResident(user) && (
                                                            <span className="text-faint-sm"
                                                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                </table>
=======
                                </Table>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            </div>
                        )}
                    </section>
                </div>
            </div>
<<<<<<< HEAD
=======
            <ConfirmDialog
                isOpen={Boolean(confirmDialog)}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() => {
                    const action = confirmDialog?.onConfirm;
                    setConfirmDialog(null);
                    action?.();
                }}
                title={confirmDialog?.title}
                confirmLabel={confirmDialog?.confirmLabel}
                variant={confirmDialog?.variant}
            >
                {confirmDialog?.message}
            </ConfirmDialog>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        </AdminLayout>
    );
}
