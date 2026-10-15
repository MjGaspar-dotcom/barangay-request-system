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
    );
}
