import { CircleAlert, ShieldCheck } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "./alert-dialog";

export default function ConfirmDialog({
    isOpen = false,
    onClose,
    onConfirm,
    title = "Confirm action",
    children,
    confirmLabel = "Confirm",
    variant = "danger",
    contentClassName,
}) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <AlertDialogContent
                aria-describedby="confirm-dialog-description"
                aria-labelledby="confirm-dialog-title"
                className={contentClassName}
            >
                <AlertDialogHeader>
                    <AlertDialogMedia
                        className={
                            variant === "danger"
                                ? "is-danger"
                                : undefined
                        }
                    >
                        {variant === "danger" ? (
                            <CircleAlert aria-hidden="true" />
                        ) : (
                            <ShieldCheck aria-hidden="true" />
                        )}
                    </AlertDialogMedia>
                    <div className="alert-dialog-copy">
                        <AlertDialogTitle id="confirm-dialog-title">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription
                            id="confirm-dialog-description"
                        >
                            {children}
                        </AlertDialogDescription>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={variant === "danger" ? "danger" : "primary"}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
