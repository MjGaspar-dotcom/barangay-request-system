import Table from "react-bootstrap/Table";
/** Props: children, className, responsive, striped, bordered, hover, size. Wraps a Bootstrap Table in the shared horizontal-scroll container. */
export default function DataTable({
    children,
    className = "",
    responsive = true,
    ...props
}) {
    return (
        <div className="table-scroll">
            <Table
                responsive={responsive}
                className={`data-table ${className}`.trim()}
                {...props}
            >
                {children}
            </Table>
        </div>
    );
}
