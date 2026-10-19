import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
/** Props: isOpen, onClose, onConfirm, title, children, confirmLabel, variant. Accessible confirmation modal. */
export default function ConfirmDialog({
    isOpen = false,
    onClose,
    onConfirm,
    title = "Confirm action",
    children,
    confirmLabel = "Confirm",
    variant = "danger",
}) {
    return (
        <Modal
            show={isOpen}
            onHide={onClose}
            centered
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            keyboard
        >
            <Modal.Header closeButton>
                <Modal.Title id="confirm-dialog-title">{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body id="confirm-dialog-description">{children}</Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant={variant === "danger" ? "danger" : "primary"}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
