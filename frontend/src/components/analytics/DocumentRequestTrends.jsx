import { useEffect, useMemo, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getDocumentRequestTrends } from "../../services/analytics";
import "./DocumentRequestTrends.css";

const PERIODS = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "custom", label: "Custom range" },
];

function localDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getInitialRange() {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 29);

    return {
        startDate: localDateValue(start),
        endDate: localDateValue(end),
    };
}

function TrendTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const point = payload[0].payload;
    const values = payload.filter(
        (entry) => entry.value !== null && entry.value !== undefined,
    );

    return (
        <div className="document-trends-tooltip">
            <strong>{point.tooltip_label}</strong>
            {values.map((entry) => (
                <span key={entry.dataKey}>
                    <i
                        className={`document-trends-tooltip-marker ${entry.dataKey === "forecast_count" ? "is-forecast" : ""}`}
                        aria-hidden="true"
                    />
                    {entry.name}: {entry.value}{" "}
                    {entry.value === 1 ? "request" : "requests"}
                </span>
            ))}
        </div>
    );
}

function TrendSkeleton() {
    return (
        <div className="document-trends-skeleton" aria-label="Loading analytics">
            <div className="document-trends-skeleton-summary">
                {Array.from({ length: 4 }, (_, index) => (
                    <span key={index} />
                ))}
            </div>
            <div className="document-trends-skeleton-chart">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}

export default function DocumentRequestTrends({
    forecast,
    forecastSeries = [],
    forecastHorizon = 1,
    onForecastHorizonChange,
}) {
    const [period, setPeriod] = useState("monthly");
    const [dateRange, setDateRange] = useState(getInitialRange);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryKey, setRetryKey] = useState(0);

    const rangeError = useMemo(() => {
        if (period !== "custom" || !dateRange.startDate || !dateRange.endDate) {
            return "";
        }

        const start = new Date(`${dateRange.startDate}T00:00:00`);
        const end = new Date(`${dateRange.endDate}T00:00:00`);
        if (end < start) return "End date must be on or after the start date.";
        if ((end - start) / 86400000 > 365) {
            return "Choose a date range of 366 days or less.";
        }

        return "";
    }, [dateRange, period]);
    const filterError =
        period === "custom" && (!dateRange.startDate || !dateRange.endDate)
            ? "Choose both a start date and an end date."
            : rangeError;

    useEffect(() => {
        if (filterError) return undefined;

        const controller = new AbortController();
        const params =
            period === "custom"
                ? {
                      period,
                      start_date: dateRange.startDate,
                      end_date: dateRange.endDate,
                  }
                : { period };

        const timeout = window.setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const data = await getDocumentRequestTrends(
                    params,
                    controller.signal,
                );
                if (!controller.signal.aborted) setResult(data);
            } catch (requestError) {
                if (!controller.signal.aborted) {
                    console.error(
                        "Failed to load document request trends:",
                        requestError,
                    );
                    setError(
                        "Unable to load document request trends. Please try again.",
                    );
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 180);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [dateRange, filterError, period, retryKey]);

    const comparison = result?.summary?.comparison;
    const comparisonLabel = !comparison
        ? "—"
        : comparison.direction === "no_previous_data"
          ? "No previous requests"
          : comparison.direction === "same"
            ? "No change"
            : `${comparison.percentage > 0 ? "+" : ""}${comparison.percentage}%`;
    const forecastHistory = forecastSeries.filter(
        (point) => point.kind !== "forecast",
    );
    const currentForecastPoint = forecastHistory.at(-1);
    const showForecastLine =
        period === "monthly" && Boolean(forecast && currentForecastPoint);
    const chartPoints = result
        ? [
              ...result.points.map((point) => ({
                  ...point,
                  forecast_count:
                      showForecastLine &&
                      point.period.slice(0, 7) === currentForecastPoint.key
                          ? point.count
                          : null,
              })),
              ...(showForecastLine
                  ? forecastSeries
                        .filter((point) => point.kind === "forecast")
                        .map((point) => ({
                            period: `${point.key}-01`,
                            label: point.axisLabel,
                            tooltip_label: point.label,
                            count: null,
                            forecast_count: point.count,
                        }))
                  : []),
          ]
        : [];

    return (
        <section
            className="document-trends-panel document-trends-combined"
            id="predictive-analytics"
            aria-labelledby="document-trends-title"
        >
            <header className="document-trends-header">
                <div>
                    <span className="portal-eyebrow">
                        ANALYTICS
                    </span>
                    <h2 id="document-trends-title">
                        Request Trends &amp; Forecast
                    </h2>
                </div>
                <div
                    className="document-trends-periods"
                    role="group"
                    aria-label="Select trend period"
                >
                    {PERIODS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={
                                period === item.key
                                    ? "document-trends-period active"
                                    : "document-trends-period"
                            }
                            aria-pressed={period === item.key}
                            onClick={() => setPeriod(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </header>

            {period === "custom" && (
                <div className="document-trends-date-range">
                    <label>
                        <span>From</span>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            max={localDateValue(new Date())}
                            onChange={(event) =>
                                setDateRange((current) => ({
                                    ...current,
                                    startDate: event.target.value,
                                }))
                            }
                        />
                    </label>
                    <label>
                        <span>To</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            max={localDateValue(new Date())}
                            onChange={(event) =>
                                setDateRange((current) => ({
                                    ...current,
                                    endDate: event.target.value,
                                }))
                            }
                        />
                    </label>
                </div>
            )}

            {filterError ? (
                <div className="document-trends-error" role="alert">
                    <span>{filterError}</span>
                </div>
            ) : loading ? (
                <TrendSkeleton />
            ) : error ? (
                <div className="document-trends-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setRetryKey((current) => current + 1)}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <div className="document-trends-summary">
                        <article>
                            <span>Total Requests</span>
                            <strong>{result.summary.total_requests}</strong>
                        </article>
                        <article>
                            <span>Average / Period</span>
                            <strong>
                                {Number(
                                    result.summary.average_requests,
                                ).toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                })}
                            </strong>
                        </article>
                        <article>
                            <span>Peak Period</span>
                            <strong className="document-trends-peak">
                                {result.summary.peak_period?.label || "—"}
                            </strong>
                            <small>
                                {result.summary.peak_period
                                    ? `${result.summary.peak_period.count} requests`
                                    : "No requests in this period"}
                            </small>
                        </article>
                        <article>
                            <span>Previous Period</span>
                            <strong
                                className={`document-trends-comparison ${comparison?.direction || ""}`}
                            >
                                {comparison?.direction === "increase" && (
                                    <i
                                        className="bi bi-arrow-up-right"
                                        aria-hidden="true"
                                    />
                                )}
                                {comparison?.direction === "decrease" && (
                                    <i
                                        className="bi bi-arrow-down-right"
                                        aria-hidden="true"
                                    />
                                )}
                                {comparisonLabel}
                            </strong>
                            <small>
                                {comparison
                                    ? `${comparison.previous_total} requests previously`
                                    : "Comparison unavailable"}
                            </small>
                        </article>
                    </div>

                    {forecast && (
                        <>
                            <div className="document-trends-forecast-summary">
                                <strong>
                                    {
                                        forecast.predictions[
                                            forecastHorizon - 1
                                        ].count
                                    }
                                </strong>
                                <span>
                                    estimated requests for{" "}
                                    {
                                        forecast.predictions[
                                            forecastHorizon - 1
                                        ].label
                                    }
                                </span>
                            </div>
                            <div className="document-trends-chart-toolbar">
                                <div
                                    className="document-trends-forecast-range"
                                    role="group"
                                    aria-label="Forecast range"
                                >
                                    {[1, 3, 6].map((months) => (
                                        <button
                                            key={months}
                                            type="button"
                                            aria-pressed={
                                                forecastHorizon === months
                                            }
                                            className={
                                                forecastHorizon === months
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                onForecastHorizonChange(months)
                                            }
                                            aria-label={`Show ${months}-month forecast`}
                                        >
                                            {months} mo
                                        </button>
                                    ))}
                                </div>
                                {showForecastLine && (
                                    <div
                                        className="document-trends-legend"
                                        aria-label="Chart legend"
                                    >
                                        <span>
                                            <i aria-hidden="true" />
                                            Actual
                                        </span>
                                        <span className="is-forecast">
                                            <i aria-hidden="true" />
                                            Forecast
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="document-trends-forecast-hint">
                                {period !== "monthly"
                                    ? "Choose Monthly to show the forecast line."
                                    : forecast.currentMonthIsPartial
                                      ? `Current month is paced to ${forecast.currentMonthEstimate} requests; forecast uses the six-month linear trend.`
                                      : "Forecast uses the six-month linear trend; actual demand may vary."}
                            </p>
                        </>
                    )}
                    {!forecast && (
                        <p
                            className="document-trends-forecast-unavailable"
                            role="status"
                        >
                            Forecast unavailable: at least three of the last
                            six months need request data.
                        </p>
                    )}

                    {result.summary.total_requests === 0 ? (
                        <div className="document-trends-empty">
                            <span className="bi bi-bar-chart-line" aria-hidden="true" />
                            <strong>No document requests in this period</strong>
                            <p>
                                Try another time period or choose a different
                                date range.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="document-trends-chart"
                            role="img"
                            aria-label={`Document requests from ${result.start_date} to ${result.end_date}${showForecastLine ? " with forecast" : ""}`}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartPoints}
                                    margin={{
                                        top: 14,
                                        right: 18,
                                        bottom: 4,
                                        left: 0,
                                    }}
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
                                        tick={{
                                            fill: "#718078",
                                            fontSize: 11,
                                        }}
                                        interval={Math.max(
                                            0,
                                            Math.ceil(
                                                chartPoints.length / 8,
                                            ) - 1,
                                        )}
                                        minTickGap={12}
                                        dy={10}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "#718078",
                                            fontSize: 11,
                                        }}
                                        width={34}
                                        domain={[0, "auto"]}
                                    />
                                    <Tooltip
                                        content={<TrendTooltip />}
                                        cursor={{
                                            stroke: "#9bb6a0",
                                            strokeDasharray: "4 4",
                                        }}
                                    />
                                    {showForecastLine && (
                                        <Line
                                            type="monotone"
                                            dataKey="forecast_count"
                                            name="Forecast"
                                            stroke="#d28c36"
                                            strokeWidth={3}
                                            strokeDasharray="7 5"
                                            connectNulls
                                            dot={{
                                                r: 4,
                                                fill: "#fff",
                                                stroke: "#d28c36",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: "#d28c36",
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                            isAnimationActive
                                            animationDuration={400}
                                            animationEasing="ease-out"
                                        />
                                    )}
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Actual requests"
                                        stroke="#287c4b"
                                        strokeWidth={3}
                                        dot={{
                                            r: 3,
                                            fill: "#fff",
                                            stroke: "#287c4b",
                                            strokeWidth: 2,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            fill: "#287c4b",
                                            stroke: "#fff",
                                            strokeWidth: 3,
                                        }}
                                        isAnimationActive
                                        animationDuration={400}
                                        animationEasing="ease-out"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
