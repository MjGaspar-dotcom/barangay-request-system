<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
/** Props: title, description, action, className. Renders a responsive page heading and optional action. */
export default function PageHeader({
    title,
    description,
    action,
    className = "",
}) {
    return (
        <header className={`page-header-row ${className}`.trim()}>
            <div className="page-header-copy">
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {action && <div className="page-header-action">{action}</div>}
        </header>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    );
}
