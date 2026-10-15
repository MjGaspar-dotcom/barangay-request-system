import { useEffect, useMemo, useState } from "react";
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
            `Change verification status of ${user.first_name} ${user.last_name} to "${newStatus}"?`,
        );

        if (!confirmAction) return;

        try {
            setBusyUserId(user.user_id);

            await api.patch(`/admin/users/${user.user_id}/verification`, {
                verification_status: newStatus,
            });

            flash(
                `Verification status updated to "${newStatus}" for ${user.first_name} ${user.last_name}.`,
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
            `Permanently delete ${user.first_name} ${user.last_name} (${user.username})? This cannot be undone.`,
        );

        if (!confirmDelete) return;

        try {
            setBusyUserId(user.user_id);

            await api.delete(`/admin/users/${user.user_id}`);

            flash(
                `Account for ${user.first_name} ${user.last_name} has been deleted.`,
            );

            await fetchUsers();
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
                <AdminPageState>
                    <Alert severity="error">{error}</Alert>
                </AdminPageState>
            </AdminLayout>
        );
    }

    const isResident = (user) => user.role === "user";

    return (
        <AdminLayout>
            <AdminPage>
                <AdminPageHeader>
                    <AdminPageLabel>USER MANAGEMENT</AdminPageLabel>

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

                                        <AdminTableHeaderCell>
                                            Username
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Email
                                        </AdminTableHeaderCell>

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
                                                    <StatusBadge
                                                        status={
                                                            user.verification_status ||
                                                            "pending"
                                                        }
                                                    />
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
                                                            >
                                                                Reject
                                                            </Button>
                                                        )}

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
        </AdminLayout>
    );
}
