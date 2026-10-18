import BootstrapButton from "react-bootstrap/Button";

/**
 * App Button (wraps react-bootstrap's Button).
 *
 * react-bootstrap silently adds `btn-primary` when no `variant` is passed.
 * Combined with classes like "btn btn-outline-danger" that gave buttons a
 * green fill with red text. This wrapper adds NO variant unless you pass one.
 *
 * Use either:  <Button variant="outline-danger">  or  <Button className="btn btn-outline-danger">
 */
export default function Button({ variant = null, ...props }) {
    return <BootstrapButton variant={variant} {...props} />;
}
