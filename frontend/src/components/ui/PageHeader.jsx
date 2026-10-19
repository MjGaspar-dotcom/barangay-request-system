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
    );
}
