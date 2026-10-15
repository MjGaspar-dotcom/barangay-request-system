import { useEffect, useState } from "react";
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
import {
    AdminDataTable,
    AdminEmptyIcon,
    AdminEmptyState,
    AdminFilterBar,
    AdminFilterField,
    AdminMessages,
    AdminPage,
    AdminPageHeader,
    AdminPageLabel,
    AdminPageState,
    AdminResultsCount,
    AdminSearchField,
    AdminSection,
    AdminTableDataCell,
    AdminTableHeaderCell,
    AdminTablePrimaryText,
    AdminTableRow,
    AdminTableWrapper,
} from "../../components/admin/AdminCrud.styles";
import {
    ActivityCode,
    ActivityIcon,
    ActivityIconCell,
    ActivityPageIndicator,
    ActivityPagination,
    ActivitySecondaryText,
    ActivityTypeHeaderCell,
} from "./RecentActivity.styles";

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

            // Laravel paginate() returns:
            // { data: [...], current_page, last_page, total, ... }
            // Some endpoints also return the array directly.
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
        if (!meta || nextPage < 1 || nextPage > meta.last_page) {
            return;
        }

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

    return (
        <AdminLayout>
            <AdminPage>
                <AdminPageHeader>
                    <AdminPageLabel>SYSTEM ACTIVITY</AdminPageLabel>

                    <h1>Recent Activity</h1>

                    <p>
                        A chronological log of every important action performed
                        on the system. Use the filters below to narrow down by
                        action type.
                    </p>
                </AdminPageHeader>

                {error && (
                    <AdminMessages>
                        <Alert severity="error">{error}</Alert>
                    </AdminMessages>
                )}

                <AdminSection>
                    <AdminFilterBar>
                        <AdminSearchField
                            type="search"
                            size="small"
                            label="Search Activity"
                            placeholder="Search descriptions, actors, table names..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <AdminFilterField
                            select
                            size="small"
                            label="Action"
                            value={actionFilter}
                            onChange={(event) =>
                                setActionFilter(event.target.value)
                            }
                        >
                            {ACTION_FILTERS.map((filter) => (
                                <MenuItem
                                    key={filter.value}
                                    value={filter.value}
                                >
                                    {filter.label}
                                </MenuItem>
                            ))}
                        </AdminFilterField>

                        {meta && (
                            <AdminResultsCount>
                                Page {meta.current_page} of {meta.last_page} •
                                Total {meta.total} entries
                            </AdminResultsCount>
                        )}
                    </AdminFilterBar>
                </AdminSection>

                <AdminSection>
                    {loading ? (
                        <AdminPageState>
                            <CircularProgress color="success" size={32} />

                            <p>Loading activity...</p>
                        </AdminPageState>
                    ) : filtered.length === 0 ? (
                        <AdminEmptyState>
                            <AdminEmptyIcon>📊</AdminEmptyIcon>

                            <h3>No Activity Found</h3>

                            <p>
                                No activity matches your current filters. Try a
                                different action type or clear the search.
                            </p>
                        </AdminEmptyState>
                    ) : (
                        <AdminTableWrapper>
                            <AdminDataTable>
                                <TableHead>
                                    <AdminTableRow>
                                        <ActivityTypeHeaderCell>
                                            Type
                                        </ActivityTypeHeaderCell>

                                        <AdminTableHeaderCell>
                                            Description
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Actor
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Target
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            IP Address
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            When
                                        </AdminTableHeaderCell>
                                    </AdminTableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.map((entry) => (
                                        <AdminTableRow key={entry.audit_log_id}>
                                            <ActivityIconCell>
                                                <ActivityIcon
                                                    actionType={entry.action}
                                                    title={entry.action}
                                                >
                                                    {actionIcon(entry.action)}
                                                </ActivityIcon>
                                            </ActivityIconCell>

                                            <AdminTableDataCell>
                                                <AdminTablePrimaryText>
                                                    {entry.description || "—"}
                                                </AdminTablePrimaryText>

                                                <ActivitySecondaryText>
                                                    Action:{" "}
                                                    <ActivityCode>
                                                        {entry.action}
                                                    </ActivityCode>
                                                </ActivitySecondaryText>
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <AdminTablePrimaryText>
                                                    {actorName(entry)}
                                                </AdminTablePrimaryText>

                                                <ActivitySecondaryText>
                                                    {actorRole(entry)}
                                                </ActivitySecondaryText>
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <ActivityCode>
                                                    {entry.table_name}
                                                </ActivityCode>{" "}
                                                #{entry.record_id}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {entry.ip_address || "—"}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {formatDate(entry.created_at)}
                                            </AdminTableDataCell>
                                        </AdminTableRow>
                                    ))}
                                </TableBody>
                            </AdminDataTable>
                        </AdminTableWrapper>
                    )}
                </AdminSection>

                {meta && meta.last_page > 1 && (
                    <ActivityPagination aria-label="Activity pagination">
                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            size="small"
                            disabled={page <= 1 || loading}
                            onClick={() => goToPage(page - 1)}
                        >
                            ← Previous
                        </Button>

                        <ActivityPageIndicator>
                            Page {page} of {meta.last_page}
                        </ActivityPageIndicator>

                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            size="small"
                            disabled={page >= meta.last_page || loading}
                            onClick={() => goToPage(page + 1)}
                        >
                            Next →
                        </Button>
                    </ActivityPagination>
                )}
            </AdminPage>
        </AdminLayout>
    );
}
