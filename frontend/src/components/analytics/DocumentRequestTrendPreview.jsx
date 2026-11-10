import { useEffect, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { getDocumentRequestTrends } from "../../services/analytics";
import "./DocumentRequestTrendPreview.css";

function PreviewTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const point = payload[0].payload;

    return (
        <div className="admin-trend-preview-tooltip">
            <strong>{point.tooltip_label}</strong>
            <span>
                {point.count} {point.count === 1 ? "request" : "requests"}
            </span>
        </div>
    );
}

export default function DocumentRequestTrendPreview({
    completedRequests,
    pendingRequests,
    dashboardLoading,
    dashboardError,
}) {
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            try {
                const result = await getDocumentRequestTrends(
                    { period: "monthly" },
                    controller.signal,
                );
                if (!controller.signal.aborted) {
                    setTrends(result);
                    setError(false);
                }
            } catch (requestError) {
                if (!controller.signal.aborted) {
                    console.error(
                        "Failed to load dashboard request trend preview:",
                        requestError,
                    );
                    setError(true);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 0);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    const previewPoints = trends?.points.slice(-6) || [];
    const hasRequests = previewPoints.some((point) => point.count > 0);

    return (
        <div className="admin-trend-preview">
            <div className="admin-trend-preview-summary">
                <div>
                    <span>Completed</span>
                    {dashboardLoading ? (
                        <span
                            className="admin-trend-preview-summary-skeleton admin-skeleton"
                            role="status"
                            aria-label="Loading completed request count"
                        />
                    ) : (
                        <strong>
                            {dashboardError ? "—" : completedRequests}
                        </strong>
                    )}
                </div>
                {dashboardLoading ? (
                    <span
                        className="admin-trend-preview-pending-skeleton admin-skeleton"
                        aria-hidden="true"
                    />
                ) : (
                    <span className="admin-trend-preview-pending">
                        {dashboardError ? "—" : pendingRequests} pending
                    </span>
                )}
            </div>

            {loading ? (
                <div
                    className="admin-trend-preview-skeleton"
                    role="status"
                    aria-label="Loading request trends"
                >
                    <svg
                        viewBox="0 0 400 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <path
                            className="admin-trend-preview-skeleton-grid"
                            d="M0 20H400 M0 50H400 M0 80H400"
                        />
                        <path
                            className="admin-trend-preview-skeleton-line"
                            d="M8 78 C48 78 54 68 82 68 S126 74 154 62 S198 54 226 58 S272 65 298 48 S346 38 392 12"
                        />
                        <path
                            className="admin-trend-preview-skeleton-dots"
                            d="M8 78H8 M82 68H82 M154 62H154 M226 58H226 M298 48H298 M392 12H392"
                        />
                    </svg>
                </div>
            ) : error ? (
                <p className="admin-trend-preview-message" role="status">
                    Trend preview is unavailable.
                </p>
            ) : !hasRequests ? (
                <p className="admin-trend-preview-message">
                    No document requests in the past six months.
                </p>
            ) : (
                <div
                    className="admin-trend-preview-chart"
                    role="img"
                    aria-label="Monthly document request trend for the past six months"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={previewPoints}
                            margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
                        >
                            <CartesianGrid
                                stroke="#e9efea"
                                strokeDasharray="3 5"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#718078", fontSize: 10 }}
                                interval="preserveStartEnd"
                                minTickGap={12}
                            />
                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#718078", fontSize: 9 }}
                                width={30}
                                domain={[0, "auto"]}
                            />
                            <Tooltip content={<PreviewTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#287c4b"
                                strokeWidth={2.5}
                                dot={{
                                    r: 3,
                                    fill: "#fff",
                                    stroke: "#287c4b",
                                    strokeWidth: 2,
                                }}
                                activeDot={{ r: 5, fill: "#287c4b" }}
                                isAnimationActive
                                animationDuration={350}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="admin-trend-preview-footer">
                <span>Monthly requests · Last 6 months</span>
                <Link to="/admin/analytics">View full analytics</Link>
            </div>
        </div>
    );
}
