import {
    StatCardContent,
    StatCardDescription,
    StatCardHeader,
    StatCardIcon,
    StatCardLabel,
    StatCardRoot,
    StatCardValue,
} from "./StatCard.styles";

export default function StatCard({
    label,
    value,
    description,
    icon,
}) {
    return (
        <StatCardRoot elevation={0}>
            <StatCardContent>
                <StatCardHeader>
                    <StatCardLabel>{label}</StatCardLabel>

                    {icon && <StatCardIcon>{icon}</StatCardIcon>}
                </StatCardHeader>

                <StatCardValue>{value}</StatCardValue>

                {description && (
                    <StatCardDescription>
                        {description}
                    </StatCardDescription>
                )}
            </StatCardContent>
        </StatCardRoot>
    );
}
