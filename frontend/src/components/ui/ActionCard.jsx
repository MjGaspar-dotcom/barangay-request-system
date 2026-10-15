import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link } from "react-router-dom";
import {
    ActionCardArrow,
    ActionCardContent,
    ActionCardDescription,
    ActionCardIcon,
    ActionCardRoot,
    ActionCardSurface,
    ActionCardTitle,
} from "./ActionCard.styles";

export default function ActionCard({
    to,
    icon,
    title,
    description,
    emphasis = false,
}) {
    return (
        <ActionCardSurface elevation={0} emphasis={emphasis}>
            <ActionCardRoot
                component={Link}
                to={to}
                aria-label={title}
            >
                <ActionCardIcon emphasis={emphasis}>{icon}</ActionCardIcon>

                <ActionCardContent>
                    <ActionCardTitle>{title}</ActionCardTitle>

                    <ActionCardDescription>
                        {description}
                    </ActionCardDescription>
                </ActionCardContent>

                <ActionCardArrow>
                    <ArrowForwardRoundedIcon />
                </ActionCardArrow>
            </ActionCardRoot>
        </ActionCardSurface>
    );
}
