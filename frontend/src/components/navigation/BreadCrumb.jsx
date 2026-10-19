import {
    BreadcrumbCurrent,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbRoot,
    BreadcrumbSeparator,
} from "./BreadCrumb.styles";

function BreadCrumb({ items = [] }) {
    return (
        <BreadcrumbRoot aria-label="Breadcrumb">
            <BreadcrumbLink to="/">Home</BreadcrumbLink>

            {items.map((item, index) => (
                <BreadcrumbItem key={index}>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>

                    {item.path ? (
                        <BreadcrumbLink to={item.path}>
                            {item.label}
                        </BreadcrumbLink>
                    ) : (
                        <BreadcrumbCurrent>{item.label}</BreadcrumbCurrent>
                    )}
                </BreadcrumbItem>
            ))}
        </BreadcrumbRoot>
    );
}

export default BreadCrumb;
