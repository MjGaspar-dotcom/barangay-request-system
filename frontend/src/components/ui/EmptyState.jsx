<<<<<<< Updated upstream
<<<<<<< Updated upstream
import {
    EmptyStateAction,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateRoot,
    EmptyStateTitle,
} from "./EmptyState.styles";

export default function EmptyState({
    icon,
    title,
    description,
    action,
}) {
    return (
        <EmptyStateRoot>
            {icon && <EmptyStateIcon>{icon}</EmptyStateIcon>}

            <EmptyStateTitle>{title}</EmptyStateTitle>

            {description && (
                <EmptyStateDescription>
                    {description}
                </EmptyStateDescription>
            )}

            {action && <EmptyStateAction>{action}</EmptyStateAction>}
        </EmptyStateRoot>
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    );
}
