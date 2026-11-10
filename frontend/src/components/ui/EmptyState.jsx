import Icon from "./Icon";

export default function EmptyState({
    message,
    title,
    icon = "inbox",
    className = "",
}) {
    return (
        <div className={`empty-state ${className}`.trim()} role="status">
            <Icon name={icon} />
            {title && <strong>{title}</strong>}
            <span>{message}</span>
        </div>
    );
}
