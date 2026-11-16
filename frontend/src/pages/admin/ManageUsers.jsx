import Icon from "../../components/ui/Icon.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Table } from "../../components/ui/table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import "./manage-users.css";

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
    const [actionMessageType, setActionMessageType] = useState("success");
    const [actionError, setActionError] = useState("");
    const [busyUserId, setBusyUserId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const flash = useCallback((message, isError = false, messageType = "success") => {
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
    }, []);

    // Initial page load shows the full-page loader. Refreshes after actions
    // happen silently so the table stays visible and the screen does not flash.
    const fetchUsers = useCallback(async ({ background = false } = {}) => {
        try {
            if (!background) setLoading(true);
            const response = await api.get("/admin/users");
            setUsers(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            if (!background) {
                setError("Failed to load users. Please refresh the page and try again.");
            } else {
                flash("The action succeeded, but the user list could not be refreshed. Please refresh the page.", true);
            }
        } finally {
            if (!background) setLoading(false);
        }
    }, [flash]);

    useEffect(() => {
        Promise.resolve().then(() => fetchUsers());
    }, [fetchUsers]);

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
                    user.street_name,
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

    const handleVerificationUpdate = async (user, newStatus) => {
        const name = fullName(user);
        if (newStatus === "verified") {
            try {
                setBusyUserId(user.user_id);
                const response = await api.get(`/admin/users/${user.user_id}`);
                const reviewUser = response.data?.data;
                if (!reviewUser) {
                    throw new Error("The resident's verification details were not returned.");
                }
                setConfirmDialog({
                    title: "Review resident before verification",
                    confirmLabel: "Confirm and verify",
                    variant: "primary",
                    reviewUser,
                    onConfirm: () => runVerificationUpdate(reviewUser, newStatus),
                });
            } catch (err) {
                console.error(err);
                flash(
                    err.response?.data?.message ||
                        "Could not load the resident's verification details.",
                    true,
                );
            } finally {
                setBusyUserId(null);
            }
            return;
        }

        setConfirmDialog({
            title: newStatus === "rejected"
                ? "Reject user verification"
                : newStatus === "pending"
                  ? "Reset user verification"
                  : "Confirm verification update",
            message: newStatus === "rejected"
                ? `Reject the verification for ${name}? Their uploaded valid ID will be removed, and they will remain unable to access verified services.`
                : newStatus === "pending"
                  ? `Reset verification for ${name}? Their uploaded valid ID will be removed and must be submitted again.`
                : `Update the verification status for ${name} to ${newStatus}?`,
            confirmLabel: newStatus === "rejected"
                ? "Reject verification"
                : newStatus === "pending"
                  ? "Reset verification"
                  : `Set ${newStatus}`,
            variant: newStatus === "rejected" || newStatus === "pending"
                ? "danger"
                : "primary",
            onConfirm: () => runVerificationUpdate(user, newStatus),
        });
    };

    const runVerificationUpdate = async (user, newStatus) => {
        try {
            setBusyUserId(user.user_id);
            await api.patch(
                `/admin/users/${user.user_id}/verification`,
                { verification_status: newStatus }
            );
            flash(
                `Verification for ${fullName(user)} was ${newStatus === "rejected" ? "rejected" : `updated to ${newStatus}`}.`,
                false,
                newStatus === "rejected" ? "danger" : "success",
            );
            await fetchUsers({ background: true });
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
        try {
            setBusyUserId(user.user_id);
            await api.delete(`/admin/users/${user.user_id}`);
            flash(
                `The account for ${fullName(user)} was deleted successfully.`,
                false,
                "danger",
            );
            await fetchUsers({ background: true });
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
        if (!value) return "ΓÇö";
        return new Date(value).toLocaleString();
    };

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div className="app-alert app-alert-danger" role="alert">{error}</div>
                </div>
            </AdminLayout>
        );
    }

    const isResident = (user) => user.role === "user";

    return (
        <AdminLayout>
            <div className="admin-dashboard manage-users-page">
                <div className="w-full">
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
                            className={`app-alert app-alert-${actionMessageType} manage-users-feedback`}
                            role="status"
                            aria-live="polite"
                        >
                            <Icon
                                name={actionMessageType === "danger" ? "exclamation-circle-fill" : "check-circle-fill"}
                            />
                            <span>{actionMessage}</span>
                        </div>
                    )}

                    {actionError && (
                        <div className="app-alert app-alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

                    <section className="dashboard-section">
                        <div
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="app-input filter-search-360"
                                placeholder="Search by name, username, email, contact, address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                
                            />

                            <select
                                className="app-select filter-select-180"
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
                                className="app-select filter-select-200"
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
                                {!loading && (
                                    <>
                                        Showing {filtered.length} of {users.length}{" "}
                                        user{users.length === 1 ? "" : "s"}
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {loading ? (
                            <SkeletonLoader
                                label="Loading users"
                                variant="table"
                                columns={9}
                            />
                        ) : filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <Icon name="people" />
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
                                                    <div className="text-muted-sm">
                                                        Street: {user.street_name || "—"}
                                                    </div>
                                                    <div className="text-muted-sm">
                                                        Address: {user.address || "—"}
                                                    </div>
                                                </td>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    {user.contact_number ||
                                                        "ΓÇö"}
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
                                                                    className="app-button app-button-success app-button-sm"
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
                                                                    className="app-button app-button-outline-danger app-button-sm"
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
                                                                    className="app-button app-button-outline-secondary app-button-sm"
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
                                                                className="app-button app-button-outline-danger app-button-sm"
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
                contentClassName={
                    confirmDialog?.reviewUser
                        ? "user-verification-dialog"
                        : undefined
                }
            >
                {confirmDialog?.reviewUser ? (
                    <VerificationReview user={confirmDialog.reviewUser} />
                ) : (
                    confirmDialog?.message
                )}
            </ConfirmDialog>
        </AdminLayout>
    );
}

function VerificationReview({ user }) {
    const details = [
        ["Name", [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ")],
        ["Username", user.username],
        ["Date of birth", user.birth_date ? new Date(user.birth_date).toLocaleDateString() : null],
        ["Gender", user.gender],
        ["Civil status", user.civil_status],
        ["Email", user.email],
        ["Contact number", user.contact_number],
        ["Address", user.address],
        ["Valid ID type", user.valid_id_type],
    ];
    const documents = [
        ["Front of valid ID", user.valid_id_front_url, user.valid_id_front_original_name],
        ["Back of valid ID", user.valid_id_back_url, user.valid_id_back_original_name],
    ];

    return (
        <div className="verification-review">
            <p className="verification-review-intro">
                Review the resident’s information and both sides of their ID before confirming verification.
            </p>
            <dl className="verification-review-details">
                {details.map(([label, value]) => (
                    <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "Not provided"}</dd>
                    </div>
                ))}
            </dl>
            <div className="verification-review-documents">
                {documents.map(([label, url, fileName]) => (
                    <section className="verification-review-document" key={label}>
                        <h3>{label}</h3>
                        {url ? (
                            <>
                                <a
                                    href={url}
                                    rel="noreferrer"
                                    target="_blank"
                                    aria-label={`Open ${label} in a new tab`}
                                >
                                    <img src={url} alt={label} />
                                </a>
                                {fileName && <p>{fileName}</p>}
                            </>
                        ) : (
                            <p className="verification-review-missing">
                                No image uploaded.
                            </p>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}
