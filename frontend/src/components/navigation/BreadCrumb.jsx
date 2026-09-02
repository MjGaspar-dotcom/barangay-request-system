import { Link } from "react-router-dom";

function BreadCrumb({ items = [] }) {
    return (
        <nav className="breadcrumb" aria-label="Breadcrumb">
            {" "}
            <Link to="/">Home</Link>
            {items.map((item, index) => (
                <span key={index} className="breadcrumb-item">
                    <span className="breadcrumb-separator">/</span>

                    {item.path ? (
                        <Link to={item.path}>{item.label}</Link>
                    ) : (
                        <span className="breadcrumb-current">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}

export default BreadCrumb;
