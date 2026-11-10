import Icon from "../../components/ui/Icon.jsx";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import api from "../../services/api";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import "./staff-analytics.css";

const DocumentRequestTrends = lazy(
    () => import("../../components/analytics/DocumentRequestTrends"),
);

const STATUS_GROUPS = [
    { label: "Pending", key: "pending", tone: "pending", color: "#e3ae44" },
    { label: "Additional Requirements", key: "additional requirements", tone: "pending", color: "#e8a36a" },
    { label: "Approved", key: "approved", tone: "approved", color: "#69b781" },
    { label: "Processing", key: "processing", tone: "processing", color: "#58b6a8" },
    { label: "Ready for Pickup", key: "ready for pickup", tone: "ready", color: "#85d9e8" },
    { label: "Completed", key: "completed", tone: "completed", color: "#e67da9" },
    { label: "Rejected", key: "rejected", tone: "rejected", color: "#c8507b" },
];

const renderStatusPercentage = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
}) => {
    if (!percent || percent < 0.045) return null;

    const radius = outerRadius * 0.62;
    const angle = (-midAngle * Math.PI) / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    return (
        <text
            x={x}
            y={y}
            className="staff-status-pie-label"
            textAnchor="middle"
            dominantBaseline="central"
        >
            {`${Math.round(percent * 100)}%`}
        </text>
    );
};

export default function StaffReports({ isAdmin = false }) {
    const Layout = isAdmin ? AdminLayout : StaffLayout;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryKey, setRetryKey] = useState(0);
    const [requestPage, setRequestPage] = useState(1);
    const requestPageSize = 10;

    const fetchRequests = useCallback(async () => {
        const response = await api.get("/staff/requests");
        const data = response.data?.data;
        if (!Array.isArray(data)) {
            throw new Error("Unexpected staff requests response.");
        }
        return data;
    }, []);

    useEffect(() => {
        let active = true;

        const loadReportData = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await fetchRequests();
                if (active) setRequests(data);
            } catch (loadError) {
                console.error("Failed to load staff request reports:", loadError);
                if (active) {
                    setError("Unable to load request reports. Please try again.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadReportData();
        return () => {
            active = false;
        };
    }, [fetchRequests, retryKey]);

    const counts = useMemo(
        () =>
            requests.reduce((result, request) => {
                const status = String(request.status || "")
                    .trim()
                    .toLowerCase();
                result[status] = (result[status] || 0) + 1;
                return result;
            }, {}),
        [requests],
    );

    const analytics = useMemo(() => {
        const total = requests.length;
        const completed = counts.completed || 0;
        const open = ["pending", "approved", "processing", "ready for pickup"]
            .reduce((sum, status) => sum + (counts[status] || 0), 0);

        const today = new Date();
        const months = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(
                Date.UTC(
                    today.getUTCFullYear(),
                    today.getUTCMonth() - 5 + index,
                    1,
                ),
            );
            const key = `${date.getUTCFullYear()}-${String(
                date.getUTCMonth() + 1,
            ).padStart(2, "0")}`;

            return {
                key,
                label: date.toLocaleDateString(undefined, {
                    month: "short",
                    timeZone: "UTC",
                }),
                count: 0,
            };
        });
        const monthCounts = new Map(months.map((month) => [month.key, month]));
        const documentCounts = new Map();
        const claimedDurations = [];

        requests.forEach((request) => {
            const createdAt = new Date(request.created_at);
            if (!Number.isNaN(createdAt.getTime())) {
                const key = `${createdAt.getUTCFullYear()}-${String(
                    createdAt.getUTCMonth() + 1,
                ).padStart(2, "0")}`;
                const month = monthCounts.get(key);
                if (month) month.count += 1;
            }

            const documentName =
                request.document_type?.document_name || "Unspecified document";
            documentCounts.set(
                documentName,
                (documentCounts.get(documentName) || 0) + 1,
            );
            if (
                String(request.status || "").trim().toLowerCase() ===
                    "completed" &&
                request.claimed_at
            ) {
                const claimedAt = new Date(request.claimed_at);
                const submittedAt = new Date(request.created_at);
                if (
                    !Number.isNaN(claimedAt.getTime()) &&
                    !Number.isNaN(submittedAt.getTime()) &&
                    claimedAt >= submittedAt
                ) {
                    claimedDurations.push(
                        (claimedAt - submittedAt) / (1000 * 60 * 60 * 24),
                    );
                }
            }
        });

        const topDocuments = [...documentCounts.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
            .slice(0, 5);

        return {
            total,
            completed,
            open,
            completionRate: total ? Math.round((completed / total) * 100) : 0,
            months,
            topDocuments,
            maxMonthlyCount: Math.max(0, ...months.map((month) => month.count)),
            maxDocumentCount: Math.max(
                0,
                ...topDocuments.map((document) => document.count),
            ),
            averageClaimDays: claimedDurations.length
                ? claimedDurations.reduce((sum, duration) => sum + duration, 0) /
                  claimedDurations.length
                : null,
        };
    }, [counts, requests]);

    const requestPageCount = Math.max(
        1,
        Math.ceil(requests.length / requestPageSize),
    );
    const paginatedRequests = requests.slice(
        (requestPage - 1) * requestPageSize,
        requestPage * requestPageSize,
    );

    const requesterName = (request) => {
        const requester = request.user;
        return (
            [requester?.first_name, requester?.last_name]
                .filter(Boolean)
                .join(" ") || "Unknown requester"
        );
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    };

    const handleRetry = () => {
        setRequestPage(1);
        setRetryKey((current) => current + 1);
    };

    return (
        <Layout>
            <section className="staff-portal staff-reports-page">
                <header className="staff-welcome">
                    <div>
                        <span className="portal-eyebrow">ANALYTICS</span>
                        <h1>System Insights</h1>
                        <p>
                            Monitor request workload, completion, and the
                            documents residents need most.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="app-alert app-alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="app-button app-button-sm app-button-outline-danger ms-2"
                            onClick={handleRetry}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {isAdmin && (
                    <Suspense
                        fallback={
                            <SkeletonLoader
                                label="Loading document request trends"
                                variant="inline"
                            />
                        }
                    >
                        <DocumentRequestTrends />
                    </Suspense>
                )}

                <section className="staff-analytics-overview" aria-label="Request overview">
                    <article className="staff-analytics-kpi">
                        <span className="staff-analytics-kpi-label">
                            COMPLETED REQUESTS
                        </span>
                        <strong>
                            {loading || error ? "—" : analytics.completed}
                        </strong>
                        <span>Documents completed across the system</span>
                    </article>
                    <article className="staff-analytics-kpi">
                        <span className="staff-analytics-kpi-label">
                            OPEN REQUESTS
                        </span>
                        <strong>{loading || error ? "—" : analytics.open}</strong>
                        <span>Pending, approved, processing, or ready for pickup</span>
                    </article>
                    <article className="staff-analytics-kpi">
                        <span className="staff-analytics-kpi-label">
                            COMPLETION RATE
                        </span>
                        <strong>
                            {loading || error
                                ? "—"
                                : `${analytics.completionRate}%`}
                        </strong>
                        <span>
                            {loading || error
                                ? "Requests completed"
                                : `${analytics.completed} of ${analytics.total} requests completed`}
                        </span>
                    </article>
                    <article className="staff-analytics-kpi">
                        <span className="staff-analytics-kpi-label">
                            AVG. TIME TO CLAIM
                        </span>
                        <strong>
                            {loading || error || analytics.averageClaimDays === null
                                ? "—"
                                : `${analytics.averageClaimDays.toFixed(1)} days`}
                        </strong>
                        <span>Based on completed requests with a claim date</span>
                    </article>
                    <article className="staff-analytics-kpi">
                        <span className="staff-analytics-kpi-label">
                            TOTAL REQUESTS
                        </span>
                        <strong>
                            {loading || error
                                ? "—"
                                : analytics.total}
                        </strong>
                        <span>Submitted by registered residents</span>
                    </article>
                </section>

                <section className="staff-analytics-grid" aria-label="Request analytics">
                    <article className="staff-analytics-panel">
                        <div className="staff-analytics-panel-heading">
                            <div>
                                <span className="staff-section-label">
                                    DOCUMENT DEMAND
                                </span>
                                <h2>Most requested</h2>
                            </div>
                        </div>
                        {loading || error ? (
                            <p className="staff-analytics-empty">
                                {loading
                                    ? "Loading document demand..."
                                    : "Document demand is unavailable."}
                            </p>
                        ) : analytics.topDocuments.length === 0 ? (
                            <p className="staff-analytics-empty">
                                Document request data will appear here.
                            </p>
                        ) : (
                            <div
                                className="staff-document-chart"
                                role="img"
                                aria-label={`Most requested document types: ${analytics.topDocuments
                                    .map(
                                        (document) =>
                                            `${document.name}: ${document.count}`,
                                    )
                                    .join(", ")}`}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.topDocuments}
                                        layout="vertical"
                                        margin={{
                                            top: 4,
                                            right: 34,
                                            bottom: 4,
                                            left: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            horizontal={false}
                                            stroke="#e8eee9"
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#738078", fontSize: 11 }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#34443a",
                                                fontSize: 12,
                                                fontWeight: 650,
                                            }}
                                            width={150}
                                            interval={0}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "#f4f7f4" }}
                                            formatter={(value) => [
                                                value,
                                                "Requests",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="#70a97a"
                                            radius={[0, 5, 5, 0]}
                                            maxBarSize={28}
                                        >
                                            <LabelList
                                                dataKey="count"
                                                position="right"
                                                fill="#243d2d"
                                                fontSize={12}
                                                fontWeight={700}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </article>

                    <article className="staff-analytics-panel staff-analytics-status">
                        <div className="staff-analytics-panel-heading">
                            <div>
                                <span className="staff-section-label">
                                    WORKLOAD
                                </span>
                                <h2>Requests by status</h2>
                            </div>
                            <strong className="staff-status-total">
                                {loading || error ? "—" : analytics.total}
                            </strong>
                        </div>
                        <div className="staff-status-breakdown">
                            <div
                                className="staff-status-pie"
                                role="img"
                                aria-label={`Request status distribution: ${STATUS_GROUPS.map(
                                    (group) =>
                                        `${group.label} ${counts[group.key] || 0}`,
                                ).join(", ")}`}
                            >
                                {analytics.total > 0 && !loading && !error ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={STATUS_GROUPS.map((group) => ({
                                                    name: group.label,
                                                    value: counts[group.key] || 0,
                                                }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius="92%"
                                                label={renderStatusPercentage}
                                                labelLine={false}
                                                stroke="#fff"
                                                strokeWidth={1}
                                            >
                                                {STATUS_GROUPS.map((group) => (
                                                    <Cell
                                                        key={group.key}
                                                        fill={group.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name) => [
                                                    `${value} requests`,
                                                    name,
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <span className="staff-status-pie-empty" />
                                )}
                            </div>
                            <div className="staff-status-list">
                            {STATUS_GROUPS.map((group) => {
                                const count = counts[group.key] || 0;
                                return (
                                    <div
                                        className={`staff-status-row status-${group.tone}`}
                                        key={group.key}
                                        style={{ "--status-color": group.color }}
                                    >
                                        <span className="staff-status-name">
                                            <span className="staff-status-dot" />
                                            {group.label}
                                        </span>
                                        <strong>
                                            {loading || error ? "—" : count}
                                        </strong>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    </article>

                </section>

                <section className="staff-report-records">
                    <div className="staff-work-card">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    REQUEST SUMMARY
                                </span>
                                <h2>Request Records</h2>
                            </div>
                            <span className="staff-work-count">
                                {loading || error ? "—" : requests.length}
                            </span>
                        </div>

                        {loading ? (
                            <SkeletonLoader
                                label="Loading request reports"
                                variant="table"
                            />
                        ) : error ? (
                            <p className="staff-report-message">
                                Report records are unavailable.
                            </p>
                        ) : requests.length === 0 ? (
                            <div className="staff-empty-state">
                                <div className="staff-empty-icon">
                                    <Icon name="bar-chart-line" />
                                </div>
                                <h3>No request records yet</h3>
                                <p>
                                    Requests available to staff will appear in
                                    this report.
                                </p>
                            </div>
                        ) : (
                            <DataTable className="staff-reports-table">
                                <thead>
                                    <tr>
                                        <th>Tracking Number</th>
                                        <th>Requester</th>
                                        <th>Document</th>
                                        <th>Submitted</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRequests.map((request) => {
                                        const requestId = request.request_id;
                                        return (
                                            <tr
                                                key={requestId}
                                            >
                                                <td>
                                                    <strong>
                                                        {request.tracking_number ||
                                                            "—"}
                                                    </strong>
                                                </td>
                                                <td>{requesterName(request)}</td>
                                                <td>
                                                    {request.document_type
                                                        ?.document_name ||
                                                        "Document request"}
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        request.created_at,
                                                    )}
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        status={
                                                            request.status ||
                                                            "Unknown"
                                                        }
                                                        size="sm"
                                                    />
                                                </td>
                                                <td>
                                                    <Link
                                                        className="staff-report-link"
                                                        to={`/${isAdmin ? "admin" : "staff"}/requests/${requestId}`}
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </DataTable>
                        )}
                        {!loading && !error && requests.length > 0 && (
                            <nav
                                className="staff-report-pagination"
                                aria-label="Request records pagination"
                            >
                                <span>
                                    Showing{" "}
                                    {(requestPage - 1) * requestPageSize + 1}
                                    –
                                    {Math.min(
                                        requestPage * requestPageSize,
                                        requests.length,
                                    )}{" "}
                                    of {requests.length} requests
                                </span>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRequestPage((page) =>
                                                Math.max(1, page - 1),
                                            )
                                        }
                                        disabled={requestPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span>
                                        Page {requestPage} of {requestPageCount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRequestPage((page) =>
                                                Math.min(
                                                    requestPageCount,
                                                    page + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            requestPage === requestPageCount
                                        }
                                    >
                                        Next
                                    </button>
                                </div>
                            </nav>
                        )}
                    </div>
                </section>
            </section>
        </Layout>
    );
}
