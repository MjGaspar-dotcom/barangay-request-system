import { StatusBadgeRoot } from "./StatusBadge.styles";

export default function StatusBadge({ status, size = "md" }) {
    return (
        <StatusBadgeRoot status={status} badgeSize={size}>
            {status}
        </StatusBadgeRoot>
    );
}
