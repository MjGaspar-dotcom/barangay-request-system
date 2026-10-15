import {
    PageHeaderAction,
    PageHeaderCopy,
    PageHeaderDescription,
    PageHeaderEyebrow,
    PageHeaderRoot,
    PageHeaderTitle,
} from "./PageHeader.styles";

export default function PageHeader({
    eyebrow,
    title,
    description,
    action,
    align = "left",
}) {
    return (
        <PageHeaderRoot align={align}>
            <PageHeaderCopy align={align}>
                {eyebrow && (
                    <PageHeaderEyebrow>{eyebrow}</PageHeaderEyebrow>
                )}

                <PageHeaderTitle component="h1">{title}</PageHeaderTitle>

                {description && (
                    <PageHeaderDescription component="p">
                        {description}
                    </PageHeaderDescription>
                )}
            </PageHeaderCopy>

            {action && <PageHeaderAction>{action}</PageHeaderAction>}
        </PageHeaderRoot>
    );
}
