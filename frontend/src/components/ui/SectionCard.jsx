import {
    SectionCardAction,
    SectionCardBody,
    SectionCardEyebrow,
    SectionCardHeader,
    SectionCardHeaderCopy,
    SectionCardRoot,
    SectionCardTitle,
} from "./SectionCard.styles";

export default function SectionCard({
    eyebrow,
    title,
    action,
    children,
}) {
    return (
        <SectionCardRoot elevation={0}>
            {(eyebrow || title || action) && (
                <SectionCardHeader>
                    <SectionCardHeaderCopy>
                        {eyebrow && (
                            <SectionCardEyebrow>
                                {eyebrow}
                            </SectionCardEyebrow>
                        )}

                        {title && (
                            <SectionCardTitle>
                                {title}
                            </SectionCardTitle>
                        )}
                    </SectionCardHeaderCopy>

                    {action && (
                        <SectionCardAction>
                            {action}
                        </SectionCardAction>
                    )}
                </SectionCardHeader>
            )}

            <SectionCardBody>{children}</SectionCardBody>
        </SectionCardRoot>
    );
}
