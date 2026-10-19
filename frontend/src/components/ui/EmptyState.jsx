/** Props: message, icon (Bootstrap Icons class), title, className. Displays a compact empty state. */
export default function EmptyState({
    message,
    title,
    icon = "bi-inbox",
    className = "",
}) {
    return (
        <div className={`empty-state ${className}`.trim()} role="status">
            <i className={`bi ${icon}`} aria-hidden="true" />
            {title && <strong>{title}</strong>}
            <span>{message}</span>
        </div>
    );
}
