import { useEffect, useMemo, useState } from "react";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    TableBody,
    TableHead,
} from "@mui/material";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import {
    AdminActionHeaderCell,
    AdminDataTable,
    AdminEmptyIcon,
    AdminEmptyState,
    AdminFilterBar,
    AdminFilterField,
    AdminMessages,
    AdminMutedText,
    AdminPage,
    AdminPageHeader,
    AdminPageLabel,
    AdminPageState,
    AdminResultsCount,
    AdminRowActions,
    AdminSearchField,
    AdminSection,
    AdminTableDataCell,
    AdminTableHeaderCell,
    AdminTablePrimaryText,
    AdminTableRow,
    AdminTableSecondaryText,
    AdminTableWrapper,
} from "../../components/admin/AdminCrud.styles";
=======
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
>>>>>>> Stashed changes
=======
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
>>>>>>> Stashed changes

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

    // Initial page load shows the full-page loader. Refreshes after actions
    // happen silently so the table stays visible and the screen does not flash.
    const fetchUsers = async ({ background = false } = {}) => {
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
                if (
                    (user.verification_status || "").toLowerCase() !==
                    verificationFilter
                ) {
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        const confirmAction = window.confirm(
            `Change verification status of ${user.first_name} ${user.last_name} to "${newStatus}"?`,
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
>>>>>>> Stashed changes

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

>>>>>>> Stashed changes
    const runVerificationUpdate = async (user, newStatus) => {
        try {
            setBusyUserId(user.user_id);

            await api.patch(`/admin/users/${user.user_id}/verification`, {
                verification_status: newStatus,
            });

            flash(
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                `Verification status updated to "${newStatus}" for ${user.first_name} ${user.last_name}.`,
            );

            await fetchUsers();
=======
                `Verification for ${fullName(user)} was ${newStatus === "rejected" ? "rejected" : `updated to ${newStatus}`}.`,
                false,
                newStatus === "rejected" ? "danger" : "success",
            );
            await fetchUsers({ background: true });
>>>>>>> Stashed changes
=======
                `Verification for ${fullName(user)} was ${newStatus === "rejected" ? "rejected" : `updated to ${newStatus}`}.`,
                false,
                newStatus === "rejected" ? "danger" : "success",
            );
            await fetchUsers({ background: true });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        const confirmDelete = window.confirm(
            `Permanently delete ${user.first_name} ${user.last_name} (${user.username})? This cannot be undone.`,
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
>>>>>>> Stashed changes

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

>>>>>>> Stashed changes
    const runDelete = async (user) => {
        try {
            setBusyUserId(user.user_id);

            await api.delete(`/admin/users/${user.user_id}`);

            flash(
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                `Account for ${user.first_name} ${user.last_name} has been deleted.`,
            );

            await fetchUsers();
=======
                `The account for ${fullName(user)} was deleted successfully.`,
                false,
                "danger",
            );
            await fetchUsers({ background: true });
>>>>>>> Stashed changes
=======
                `The account for ${fullName(user)} was deleted successfully.`,
                false,
                "danger",
            );
            await fetchUsers({ background: true });
>>>>>>> Stashed changes
        } catch (err) {
            console.error(err);

            const msg =
                err.response?.data?.message || "Failed to delete the account.";

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
                <AdminPageState>
                    <CircularProgress color="success" size={32} />

                    <p>Loading users...</p>
                </AdminPageState>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
<<<<<<< Updated upstream
                <AdminPageState>
                    <Alert severity="error">{error}</Alert>
                </AdminPageState>
=======
                <div className="page-loading">
                    <div className="alert alert-danger" role="alert">{error}</div>
                </div>
>>>>>>> Stashed changes
            </AdminLayout>
        );
    }

    const isResident = (user) => user.role === "user";

    return (
        <AdminLayout>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            <AdminPage>
                <AdminPageHeader>
                    <AdminPageLabel>USER MANAGEMENT</AdminPageLabel>
=======
=======
>>>>>>> Stashed changes
            <div className="admin-dashboard manage-users-page">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                USER MANAGEMENT
                            </span>
>>>>>>> Stashed changes

                    <h1>Manage Users</h1>

                    <p>
                        Review resident accounts, update their verification
                        status, and remove accounts that are no longer active.
                    </p>
                </AdminPageHeader>

                {(actionMessage || actionError) && (
                    <AdminMessages>
                        {actionMessage && (
                            <Alert severity="success">{actionMessage}</Alert>
                        )}

                        {actionError && (
                            <Alert severity="error">{actionError}</Alert>
                        )}
                    </AdminMessages>
                )}

                <AdminSection>
                    <AdminFilterBar>
                        <AdminSearchField
                            type="search"
                            size="small"
                            label="Search Users"
                            placeholder="Search by name, username, email, contact, purok..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <AdminFilterField
                            select
                            size="small"
                            label="Role"
                            value={roleFilter}
                            onChange={(event) =>
                                setRoleFilter(event.target.value)
                            }
                        >
                            {ROLE_FILTERS.map((filter) => (
                                <MenuItem
                                    key={filter.value}
                                    value={filter.value}
                                >
                                    {filter.label}
                                </MenuItem>
                            ))}
                        </AdminFilterField>

                        <AdminFilterField
                            select
                            size="small"
                            label="Verification"
                            value={verificationFilter}
                            onChange={(event) =>
                                setVerificationFilter(event.target.value)
                            }
                        >
                            {VERIFICATION_FILTERS.map((filter) => (
                                <MenuItem
                                    key={filter.value}
                                    value={filter.value}
                                >
                                    {filter.label}
                                </MenuItem>
                            ))}
                        </AdminFilterField>

                        <AdminResultsCount>
                            Showing {filtered.length} of {users.length} user
                            {users.length === 1 ? "" : "s"}
                        </AdminResultsCount>
                    </AdminFilterBar>
                </AdminSection>

                <AdminSection>
                    {filtered.length === 0 ? (
                        <AdminEmptyState>
                            <AdminEmptyIcon>👥</AdminEmptyIcon>

                            <h3>No Users Found</h3>

                            <p>
                                No accounts match your current filters. Try
                                adjusting the search or filters above.
                            </p>
                        </AdminEmptyState>
                    ) : (
                        <AdminTableWrapper>
                            <AdminDataTable>
                                <TableHead>
                                    <AdminTableRow>
                                        <AdminTableHeaderCell>
                                            Name
                                        </AdminTableHeaderCell>

<<<<<<< Updated upstream
                                        <AdminTableHeaderCell>
                                            Username
                                        </AdminTableHeaderCell>
=======
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
>>>>>>> Stashed changes

                                        <AdminTableHeaderCell>
                                            Email
                                        </AdminTableHeaderCell>

<<<<<<< Updated upstream
                                        <AdminTableHeaderCell>
                                            Contact
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Role
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Verification
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Requests
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Created
                                        </AdminTableHeaderCell>

                                        <AdminActionHeaderCell>
                                            Actions
                                        </AdminActionHeaderCell>
                                    </AdminTableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.map((user) => (
                                        <AdminTableRow key={user.user_id}>
                                            <AdminTableDataCell>
                                                <AdminTablePrimaryText>
                                                    {fullName(user)}
                                                </AdminTablePrimaryText>

                                                <AdminTableSecondaryText>
                                                    {user.address || "—"}
                                                </AdminTableSecondaryText>
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {user.username}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {user.email}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {user.contact_number || "—"}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <StatusBadge
                                                    status={user.role}
                                                />
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {isResident(user) ? (
=======
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
>>>>>>> Stashed changes
                                                    <StatusBadge
                                                        status={
                                                            user.verification_status ||
                                                            "pending"
                                                        }
                                                    />
<<<<<<< Updated upstream
                                                ) : (
                                                    <AdminMutedText>
                                                        N/A
                                                    </AdminMutedText>
                                                )}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {user.total_requests ?? 0}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {formatDate(user.created_at)}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <AdminRowActions>
                                                    {isResident(user) &&
                                                        user.verification_status !==
                                                            "verified" && (
=======
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                                                            <Button
                                                                type="button"
                                                                variant="contained"
                                                                color="success"
                                                                size="small"
                                                                disabled={
                                                                    busyUserId ===
                                                                    user.user_id
                                                                }
                                                                onClick={() =>
                                                                    handleVerificationUpdate(
                                                                        user,
                                                                        "verified",
                                                                    )
                                                                }
                                                            >
<<<<<<< Updated upstream
                                                                Verify
                                                            </Button>
                                                        )}

                                                    {isResident(user) &&
                                                        user.verification_status !==
                                                            "rejected" && (
                                                            <Button
                                                                type="button"
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                disabled={
                                                                    busyUserId ===
                                                                    user.user_id
                                                                }
                                                                onClick={() =>
                                                                    handleVerificationUpdate(
                                                                        user,
                                                                        "rejected",
                                                                    )
                                                                }
=======
                                                                Delete
                                                            </Button>
                                                        )}

                                                        {!isResident(user) && (
                                                            <span className="text-faint-sm"
                                                                
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                                                            >
                                                                Reject
                                                            </Button>
                                                        )}
<<<<<<< Updated upstream

                                                    {isResident(user) &&
                                                        user.verification_status !==
                                                            "pending" && (
                                                            <Button
                                                                type="button"
                                                                variant="outlined"
                                                                color="secondary"
                                                                size="small"
                                                                disabled={
                                                                    busyUserId ===
                                                                    user.user_id
                                                                }
                                                                onClick={() =>
                                                                    handleVerificationUpdate(
                                                                        user,
                                                                        "pending",
                                                                    )
                                                                }
                                                            >
                                                                Reset
                                                            </Button>
                                                        )}

                                                    {isResident(user) && (
                                                        <Button
                                                            type="button"
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            disabled={
                                                                busyUserId ===
                                                                user.user_id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    user,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}

                                                    {!isResident(user) && (
                                                        <AdminMutedText>
                                                            Managed in Staff
                                                            section
                                                        </AdminMutedText>
                                                    )}
                                                </AdminRowActions>
                                            </AdminTableDataCell>
                                        </AdminTableRow>
                                    ))}
                                </TableBody>
                            </AdminDataTable>
                        </AdminTableWrapper>
                    )}
                </AdminSection>
            </AdminPage>
=======
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        </AdminLayout>
    );
}
