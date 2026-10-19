import { useMemo, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

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
    const users = useMemo(() => [], []);
    const loading = false;
    const error =
        "User management is unavailable because the API does not provide a user-list endpoint.";
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [actionMessage, setActionMessage] = useState("");
    const [actionMessageType, setActionMessageType] = useState("success");
    const [actionError, setActionError] = useState("");
    const [busyUserId, setBusyUserId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

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

    const flash = (message, isError = false, messageType = "success") => {
        if (isError) {
            setActionError(message);
            setActionMessage("");
        } else {
            setActionMessage(message);
            setActionMessageType(messageType);
            setActionError("");
        }

        window.setTimeout(() => {
            setActionMessage("");
            setActionError("");
        }, 4000);
    };

    const handleVerificationUpdate = async (user, newStatus) => {
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
        setBusyUserId(user.user_id);
        flash(
            `Setting verification to ${newStatus} is unavailable because the API does not provide this operation.`,
            true,
        );
        setBusyUserId(null);
    };

    const handleDelete = async (user) => {
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
        setBusyUserId(user.user_id);
        flash(
            "Account deletion is unavailable because the API does not provide this operation.",
            true,
        );
        setBusyUserId(null);
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
                <div className="admin-dashboard manage-users-page">
                    <div className="container-fluid">
                        <div className="dashboard-page-header">
                            <div>
                                <span className="section-label">
                                    USER MANAGEMENT
                                </span>
                                <h1>Manage Users</h1>
                            </div>
                        </div>
                        <div className="alert alert-info" role="status">
                            {error}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const isResident = (user) => user.role === "user";

    return (
        <AdminLayout>
            <div className="admin-dashboard manage-users-page">
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
                            className={`alert alert-${actionMessageType} manage-users-feedback`}
                            role="status"
                            aria-live="polite"
                        >
                            <i
                                className={`bi ${actionMessageType === "danger" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"}`}
                                aria-hidden="true"
                            />
                            <span>{actionMessage}</span>
                        </div>
                    )}

                    {actionError && (
                        <div className="alert alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

                    <section className="dashboard-section">
                        <div
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="form-control filter-search-360"
                                placeholder="Search by name, username, email, contact, address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                
                            />

                            <select
                                className="form-select filter-select-180"
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(event.target.value)
                                }
                                
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
                                className="form-select filter-select-200"
                                value={verificationFilter}
                                onChange={(event) =>
                                    setVerificationFilter(event.target.value)
                                }
                                
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

                            <div className="filter-count"
                                
                            >
                                Showing {filtered.length} of {users.length}{" "}
                                user{users.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <i className="bi bi-people" />
                                </div>
                                <h3>No Users Found</h3>
                                <p>
                                    No accounts match your current filters.
                                    Try adjusting the search or filters above.
                                </p>
                            </div>
                        ) : (
                            <div
                                className="table-scroll admin-table-wrapper u-scroll-x"
                                
                            >
                                <Table className="admin-table data-table manage-users-table">
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
                                            <th className="manage-users-actions-heading">
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
                                                    <div className="text-muted-sm"
                                                        
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
                                                        <span className="text-faint"
                                                            
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
                                                <td className="manage-users-actions-cell">
                                                    <div className="action-row-tight manage-users-actions"
                                                        
                                                    >
                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "verified" && (
                                                                <Button
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
                                                                </Button>
                                                            )}

                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "rejected" && (
                                                                <Button
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
                                                                </Button>
                                                            )}

                                                        {isResident(user) &&
                                                            user.verification_status !==
                                                                "pending" && (
                                                                <Button
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
                                                                </Button>
                                                            )}

                                                        {isResident(user) && (
                                                            <Button
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
                                                            </Button>
                                                        )}

                                                        {!isResident(user) && (
                                                            <span className="text-faint-sm"
                                                                
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
                                </Table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
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
        </AdminLayout>
    );
}
