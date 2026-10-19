import {
    RoleCardAction,
    RoleCardDescription,
    RoleCardIcon,
    RoleCardRoot,
    RoleCardTitle,
} from "./RoleCard.styles";

function RoleCard({ title, description, icon, onClick }) {
    return (
        <RoleCardRoot type="button" onClick={onClick}>
            {icon && <RoleCardIcon>{icon}</RoleCardIcon>}

            <RoleCardTitle>{title}</RoleCardTitle>

            <RoleCardDescription>{description}</RoleCardDescription>

            <RoleCardAction>Continue →</RoleCardAction>
        </RoleCardRoot>
    );
}

export default RoleCard;
