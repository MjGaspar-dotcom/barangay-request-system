const TABLE_ROWS = Array.from({ length: 6 }, (_, index) => index);
const DETAIL_FIELDS = Array.from({ length: 6 }, (_, index) => index);

export default function SkeletonLoader({
    label = "Loading",
    variant = "table",
    columns = 4,
}) {
    const tableColumns = Array.from({ length: columns }, (_, index) => index);

    if (variant === "inline") {
        return (
            <div
                className="skeleton-loader skeleton-loader-inline"
                role="status"
                aria-label={label}
            >
                <span />
                <span />
                <span />
            </div>
        );
    }

    return (
        <div
            className={`skeleton-loader skeleton-loader-${variant}`}
            role="status"
            aria-label={label}
        >
            <div className="skeleton-loader-heading" aria-hidden="true">
                <div>
                    <span />
                    <span />
                </div>
                <span />
            </div>

            {variant !== "detail" && (
                <div
                    className="skeleton-loader-toolbar"
                    aria-hidden="true"
                >
                    <span />
                    <span />
                    <span />
                </div>
            )}

            {variant === "detail" ? (
                <div className="skeleton-loader-detail" aria-hidden="true">
                    <span />
                    <div>
                        {DETAIL_FIELDS.map((field) => (
                            <div key={field}>
                                <span />
                                <span />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div
                    className="skeleton-loader-table"
                    aria-hidden="true"
                    style={{ "--skeleton-columns": columns }}
                >
                    <div className="skeleton-loader-table-row is-header">
                        {tableColumns.map((column) => (
                            <span key={column} />
                        ))}
                    </div>
                    {TABLE_ROWS.map((row) => (
                        <div className="skeleton-loader-table-row" key={row}>
                            {tableColumns.map((column) => (
                                <span key={column} />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
