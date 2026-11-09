import Button from "./Button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog";

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent aria-describedby="confirm-dialog-description">
                <DialogHeader>
                    <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
                </DialogHeader>
                <DialogDescription id="confirm-dialog-description" asChild>
                    <div>{children}</div>
                </DialogDescription>
                <DialogFooter>
                    <Button variant="outline-secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant={variant === "danger" ? "danger" : "primary"}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
